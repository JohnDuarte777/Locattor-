import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import { currentMonth } from '../lib/format';
import { syncPayments } from '../lib/rental';
import { EMPTY_DATA, type AppData } from './types';

const STORAGE_KEY = 'locattor:data:v1';

type Collection = keyof AppData;
type Item<K extends Collection> = AppData[K][number];

type Action =
  | { type: 'load'; data: AppData }
  | { type: 'upsert'; collection: Collection; item: { id: string } }
  | { type: 'remove'; collection: Collection; id: string }
  | { type: 'removeProperty'; id: string }
  | { type: 'removeTenant'; id: string }
  | { type: 'removeContract'; id: string };

function withPayments(data: AppData): AppData {
  const payments = syncPayments(data, currentMonth());
  return payments === data.payments ? data : { ...data, payments };
}

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'load':
      return withPayments({ ...EMPTY_DATA, ...action.data });
    case 'upsert': {
      const list = state[action.collection] as { id: string }[];
      const exists = list.some((i) => i.id === action.item.id);
      const next = exists
        ? list.map((i) => (i.id === action.item.id ? action.item : i))
        : [...list, action.item];
      return withPayments({ ...state, [action.collection]: next });
    }
    case 'remove': {
      const list = state[action.collection] as { id: string }[];
      return { ...state, [action.collection]: list.filter((i) => i.id !== action.id) };
    }
    case 'removeContract':
      return {
        ...state,
        contracts: state.contracts.filter((c) => c.id !== action.id),
        payments: state.payments.filter((p) => p.contractId !== action.id),
      };
    case 'removeTenant': {
      const contractIds = new Set(
        state.contracts.filter((c) => c.tenantId === action.id).map((c) => c.id),
      );
      return {
        ...state,
        tenants: state.tenants.filter((t) => t.id !== action.id),
        contracts: state.contracts.filter((c) => !contractIds.has(c.id)),
        payments: state.payments.filter((p) => !contractIds.has(p.contractId)),
      };
    }
    case 'removeProperty': {
      const contractIds = new Set(
        state.contracts.filter((c) => c.propertyId === action.id).map((c) => c.id),
      );
      return {
        ...state,
        properties: state.properties.filter((p) => p.id !== action.id),
        contracts: state.contracts.filter((c) => !contractIds.has(c.id)),
        payments: state.payments.filter((p) => !contractIds.has(p.contractId)),
        expenses: state.expenses.filter((e) => e.propertyId !== action.id),
      };
    }
  }
}

interface StoreValue {
  data: AppData;
  loaded: boolean;
  upsert: <K extends Collection>(collection: K, item: Item<K>) => void;
  remove: (collection: Collection, id: string) => void;
  removeProperty: (id: string) => void;
  removeTenant: (id: string) => void;
  removeContract: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    (s: { data: AppData; loaded: boolean }, a: Action) => ({
      data: reducer(s.data, a),
      loaded: s.loaded || a.type === 'load',
    }),
    { data: EMPTY_DATA, loaded: false },
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => dispatch({ type: 'load', data: raw ? JSON.parse(raw) : EMPTY_DATA }))
      .catch(() => dispatch({ type: 'load', data: EMPTY_DATA }));
  }, []);

  useEffect(() => {
    if (!state.loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.data)).catch(() => {});
  }, [state.data, state.loaded]);

  const upsert = useCallback(<K extends Collection>(collection: K, item: Item<K>) => {
    dispatch({ type: 'upsert', collection, item });
  }, []);
  const remove = useCallback((collection: Collection, id: string) => {
    dispatch({ type: 'remove', collection, id });
  }, []);
  const removeProperty = useCallback((id: string) => dispatch({ type: 'removeProperty', id }), []);
  const removeTenant = useCallback((id: string) => dispatch({ type: 'removeTenant', id }), []);
  const removeContract = useCallback((id: string) => dispatch({ type: 'removeContract', id }), []);

  const value = useMemo(
    () => ({ ...state, upsert, remove, removeProperty, removeTenant, removeContract }),
    [state, upsert, remove, removeProperty, removeTenant, removeContract],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore deve ser usado dentro de <StoreProvider>');
  return ctx;
}

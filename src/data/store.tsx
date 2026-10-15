import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';

import { currentMonth } from '../lib/format';
import { syncPayments } from '../lib/rental';
import { dataRepository, type Collection } from '../services';
import { diffData } from './diff';
import { EMPTY_DATA, type AppData } from './types';

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
  /** Mensagem do último erro ao carregar ou salvar, se houver. */
  error?: string;
  upsert: <K extends Collection>(collection: K, item: Item<K>) => void;
  remove: (collection: Collection, id: string) => void;
  removeProperty: (id: string) => void;
  removeTenant: (id: string) => void;
  removeContract: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

interface State {
  data: AppData;
  loaded: boolean;
  error?: string;
}

/** Dados do usuário logado. Recrie o provider (via `key`) ao trocar de usuário. */
export function StoreProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [state, dispatch] = useReducer(
    (s: State, a: Action | { type: 'error'; message: string }): State =>
      a.type === 'error'
        ? { ...s, error: a.message }
        : { data: reducer(s.data, a), loaded: s.loaded || a.type === 'load', error: s.error },
    { data: EMPTY_DATA, loaded: false },
  );
  /** Último estado já gravado no repositório, para enviar só as diferenças. */
  const saved = useRef<AppData>(EMPTY_DATA);
  /** Se o carregamento falhar, não grava nada para não sobrescrever os dados reais. */
  const loadFailed = useRef(false);

  useEffect(() => {
    dataRepository
      .load(userId)
      .then((data) => {
        saved.current = data;
        dispatch({ type: 'load', data });
      })
      .catch(() => {
        loadFailed.current = true;
        dispatch({ type: 'error', message: 'Não foi possível carregar seus dados.' });
        dispatch({ type: 'load', data: EMPTY_DATA });
      });
  }, [userId]);

  useEffect(() => {
    if (!state.loaded || loadFailed.current) return;
    const changes = diffData(saved.current, state.data);
    if (changes.length === 0) return;
    saved.current = state.data;
    dataRepository
      .save(userId, state.data, changes)
      .catch(() => dispatch({ type: 'error', message: 'Não foi possível salvar as últimas alterações.' }));
  }, [state.data, state.loaded, userId]);

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

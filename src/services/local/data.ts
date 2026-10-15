import AsyncStorage from '@react-native-async-storage/async-storage';

import { EMPTY_DATA, type AppData } from '../../data/types';
import { newId } from '../../lib/id';
import type { DataRepository } from '../types';

/** Dados guardados no aparelho, separados por usuário. */

const dataKey = (userId: string) => `locattor:data:v2:${userId}`;

/** Chave usada pela primeira versão do app, antes de existir login. */
const LEGACY_KEY = 'locattor:data:v1';

/**
 * Converte os IDs antigos em UUIDs (formato exigido pelo banco online),
 * atualizando também as referências entre registros.
 */
export function remapIds(data: AppData): AppData {
  const ids = new Map<string, string>();
  const map = (id: string) => {
    if (!ids.has(id)) ids.set(id, newId());
    return ids.get(id)!;
  };
  return {
    properties: data.properties.map((p) => ({ ...p, id: map(p.id) })),
    tenants: data.tenants.map((t) => ({ ...t, id: map(t.id) })),
    contracts: data.contracts.map((c) => ({
      ...c,
      id: map(c.id),
      propertyId: map(c.propertyId),
      tenantId: map(c.tenantId),
    })),
    payments: data.payments.map((p) => ({ ...p, id: map(p.id), contractId: map(p.contractId) })),
    expenses: data.expenses.map((e) => ({ ...e, id: map(e.id), propertyId: map(e.propertyId) })),
  };
}

export const localDataRepository: DataRepository = {
  async load(userId) {
    const raw = await AsyncStorage.getItem(dataKey(userId));
    if (raw) return { ...EMPTY_DATA, ...JSON.parse(raw) };

    // Primeiro login após a atualização: os dados cadastrados antes do login
    // passam a pertencer a este usuário.
    const legacy = await AsyncStorage.getItem(LEGACY_KEY);
    if (!legacy) return EMPTY_DATA;
    const data = remapIds({ ...EMPTY_DATA, ...JSON.parse(legacy) });
    await AsyncStorage.setItem(dataKey(userId), JSON.stringify(data));
    await AsyncStorage.removeItem(LEGACY_KEY);
    return data;
  },

  async save(userId, data) {
    await AsyncStorage.setItem(dataKey(userId), JSON.stringify(data));
  },
};

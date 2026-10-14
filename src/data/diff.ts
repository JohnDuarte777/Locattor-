import type { Change, Collection } from '../services/types';
import type { AppData } from './types';

/**
 * Ordem respeitando as dependências entre tabelas: imóveis e inquilinos antes
 * de contratos, contratos antes de cobranças. Exclusões seguem a ordem inversa.
 */
export const COLLECTION_ORDER: Collection[] = ['properties', 'tenants', 'contracts', 'payments', 'expenses'];

/** Lista os registros criados, alterados e excluídos entre dois estados. */
export function diffData(prev: AppData, next: AppData): Change[] {
  const upserts: Change[] = [];
  const deletes: Change[] = [];

  for (const collection of COLLECTION_ORDER) {
    const before = prev[collection] as { id: string }[];
    const after = next[collection] as { id: string }[];
    if (before === after) continue;

    const beforeById = new Map(before.map((i) => [i.id, i]));
    const afterIds = new Set<string>();
    for (const item of after) {
      afterIds.add(item.id);
      if (beforeById.get(item.id) !== item) upserts.push({ type: 'upsert', collection, item });
    }
    for (const item of before) {
      if (!afterIds.has(item.id)) deletes.push({ type: 'delete', collection, id: item.id });
    }
  }

  return [...upserts, ...deletes.reverse()];
}

import { randomUUID } from 'expo-crypto';

/** Gera um UUID v4, compatível com chaves primárias `uuid` de bancos como o PostgreSQL. */
export function newId(): string {
  return randomUUID();
}

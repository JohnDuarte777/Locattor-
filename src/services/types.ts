import type { AppData } from '../data/types';

/**
 * Contratos entre o app e o backend. A implementação atual é local
 * (`services/local`); para migrar para um banco online basta criar outra
 * implementação destas interfaces e trocá-la em `services/index.ts`.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

export interface AuthService {
  /** Sessão salva no aparelho, ou null se ninguém estiver logado. */
  getCurrentUser(): Promise<User | null>;
  signIn(email: string, password: string): Promise<User>;
  signUp(input: SignUpInput): Promise<User>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
}

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_in_use'
  | 'unsupported'
  | 'unknown';

export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export type Collection = keyof AppData;

/** Uma alteração atômica em um registro, pronta para ser enviada a um banco. */
export type Change =
  | { type: 'upsert'; collection: Collection; item: { id: string } }
  | { type: 'delete'; collection: Collection; id: string };

export interface DataRepository {
  /** Carrega todos os dados do usuário. */
  load(userId: string): Promise<AppData>;
  /**
   * Persiste uma alteração. `data` é o estado completo após a alteração e
   * `changes` a lista de registros criados/alterados/excluídos — um banco
   * online deve usar `changes`; o armazenamento local grava `data` inteiro.
   */
  save(userId: string, data: AppData, changes: Change[]): Promise<void>;
}

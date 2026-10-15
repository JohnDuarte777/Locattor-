import { localAuth } from './local/auth';
import { localDataRepository } from './local/data';
import type { AuthService, DataRepository } from './types';

/**
 * Backend em uso pelo app. Para migrar para o banco online, crie as
 * implementações (ex.: `services/supabase/auth.ts` e `services/supabase/data.ts`)
 * e troque as duas linhas abaixo. Veja docs/MIGRACAO_BANCO.md.
 */
export const authService: AuthService = localAuth;
export const dataRepository: DataRepository = localDataRepository;

export * from './types';

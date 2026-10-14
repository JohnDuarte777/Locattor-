import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authService, type SignUpInput, type User } from '../services';

interface AuthValue {
  user: User | null;
  /** true enquanto a sessão salva no aparelho está sendo verificada. */
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setInitializing(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setUser(await authService.signIn(email, password));
  }, []);
  const signUp = useCallback(async (input: SignUpInput) => {
    setUser(await authService.signUp(input));
  }, []);
  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
  }, []);
  const requestPasswordReset = useCallback((email: string) => authService.requestPasswordReset(email), []);

  const value = useMemo(
    () => ({ user, initializing, signIn, signUp, signOut, requestPasswordReset }),
    [user, initializing, signIn, signUp, signOut, requestPasswordReset],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}

/** Mensagem amigável para exibir ao usuário a partir de um erro de autenticação. */
export function authErrorMessage(error: unknown): string {
  return error instanceof Error && error.name === 'AuthError'
    ? error.message
    : 'Não foi possível concluir. Verifique sua conexão e tente novamente.';
}

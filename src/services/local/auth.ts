import AsyncStorage from '@react-native-async-storage/async-storage';
import { CryptoDigestAlgorithm, digestStringAsync, getRandomBytes } from 'expo-crypto';

import { newId } from '../../lib/id';
import { AuthError, type AuthService, type SignUpInput, type User } from '../types';

/**
 * Autenticação local, guardada no próprio aparelho. Serve para desenvolver e
 * testar o app antes de existir um banco online: as contas só existem neste
 * aparelho e não há envio de e-mail para recuperar a senha.
 */

const USERS_KEY = 'locattor:auth:users';
const SESSION_KEY = 'locattor:auth:session';

interface StoredUser extends User {
  salt: string;
  passwordHash: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

async function readUsers(): Promise<StoredUser[]> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function publicUser({ salt: _salt, passwordHash: _hash, ...user }: StoredUser): User {
  return user;
}

export const localAuth: AuthService = {
  async getCurrentUser() {
    const userId = await AsyncStorage.getItem(SESSION_KEY);
    if (!userId) return null;
    const user = (await readUsers()).find((u) => u.id === userId);
    return user ? publicUser(user) : null;
  },

  async signIn(email, password) {
    const user = (await readUsers()).find((u) => u.email === normalizeEmail(email));
    if (!user || (await hashPassword(password, user.salt)) !== user.passwordHash) {
      throw new AuthError('invalid_credentials', 'E-mail ou senha incorretos.');
    }
    await AsyncStorage.setItem(SESSION_KEY, user.id);
    return publicUser(user);
  },

  async signUp({ name, email, password }: SignUpInput) {
    const users = await readUsers();
    const normalized = normalizeEmail(email);
    if (users.some((u) => u.email === normalized)) {
      throw new AuthError('email_in_use', 'Já existe uma conta com este e-mail.');
    }
    const salt = toHex(getRandomBytes(16));
    const user: StoredUser = {
      id: newId(),
      name: name.trim(),
      email: normalized,
      createdAt: new Date().toISOString(),
      salt,
      passwordHash: await hashPassword(password, salt),
    };
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
    await AsyncStorage.setItem(SESSION_KEY, user.id);
    return publicUser(user);
  },

  async signOut() {
    await AsyncStorage.removeItem(SESSION_KEY);
  },

  async requestPasswordReset() {
    throw new AuthError(
      'unsupported',
      'A recuperação de senha por e-mail estará disponível quando o app usar o banco online.',
    );
  },
};

import { router } from 'expo-router';

/** Volta para a tela anterior ou, se não houver, para o início. */
export function goBack(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

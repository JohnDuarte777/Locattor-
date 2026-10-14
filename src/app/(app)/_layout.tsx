import { Stack } from 'expo-router';

import { useAuth } from '../../auth/AuthProvider';
import { Loading } from '../../components/Loading';
import { colors } from '../../components/theme';
import { StoreProvider, useStore } from '../../data/store';

function AppStack() {
  const { loaded } = useStore();
  if (!loaded) return <Loading />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function AppLayout() {
  const { user } = useAuth();
  if (!user) return null;
  // A `key` recria o store ao trocar de usuário, sem misturar dados de contas.
  return (
    <StoreProvider key={user.id} userId={user.id}>
      <AppStack />
    </StoreProvider>
  );
}

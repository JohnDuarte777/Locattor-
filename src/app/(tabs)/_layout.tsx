import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';

import { colors } from '../../components/theme';
import type { IconName } from '../../components/ui';

function icon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início', headerTitle: 'Locattor', tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen name="imoveis" options={{ title: 'Imóveis', tabBarIcon: icon('business-outline') }} />
      <Tabs.Screen name="inquilinos" options={{ title: 'Inquilinos', tabBarIcon: icon('people-outline') }} />
      <Tabs.Screen name="contratos" options={{ title: 'Contratos', tabBarIcon: icon('document-text-outline') }} />
      <Tabs.Screen name="financeiro" options={{ title: 'Financeiro', tabBarIcon: icon('cash-outline') }} />
    </Tabs>
  );
}

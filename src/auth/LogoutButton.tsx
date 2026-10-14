import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Platform, Pressable } from 'react-native';

import { useAuth } from './AuthProvider';

export function LogoutButton() {
  const { signOut } = useAuth();

  const confirm = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Deseja sair da sua conta?')) signOut();
      return;
    }
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <Pressable onPress={confirm} hitSlop={12} accessibilityLabel="Sair da conta" style={{ paddingHorizontal: 16 }}>
      <Ionicons name="log-out-outline" size={24} color="#fff" />
    </Pressable>
  );
}

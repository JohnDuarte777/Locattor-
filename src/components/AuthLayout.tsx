import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from './theme';

/** Moldura das telas de login, cadastro e recuperação de senha. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.flex} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.brand}>
            <View style={s.logo}>
              <Ionicons name="business" size={36} color={colors.primary} />
            </View>
            <Text style={s.appName}>Locattor</Text>
            <Text style={s.tagline}>Gestão de imóveis para aluguel</Text>
          </View>
          <View style={s.card}>
            <Text style={s.title}>{title}</Text>
            {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
            <View style={s.body}>{children}</View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xl },
  brand: { alignItems: 'center', gap: spacing.xs },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  appName: { fontSize: 28, fontWeight: '800', color: '#fff' },
  tagline: { fontSize: 14, color: colors.primaryLight },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.xl, gap: spacing.xs },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted },
  body: { gap: spacing.md, marginTop: spacing.md },
});

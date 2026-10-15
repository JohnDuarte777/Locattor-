import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { authErrorMessage, useAuth } from '../../auth/AuthProvider';
import { AuthLayout } from '../../components/AuthLayout';
import { colors } from '../../components/theme';
import { Button, Field } from '../../components/ui';
import { isValidEmail } from '../../lib/validation';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!isValidEmail(email)) e.email = 'Informe um e-mail válido.';
    if (!password) e.password = 'Informe sua senha.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setErrors({ form: authErrorMessage(err) });
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Entrar" subtitle="Acesse sua conta para gerenciar seus imóveis.">
      <Field
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        placeholder="voce@exemplo.com"
        error={errors.email}
      />
      <Field
        label="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        onSubmitEditing={submit}
        returnKeyType="go"
        error={errors.password}
      />
      <Link href="/recuperar-senha" style={s.link}>
        Esqueci minha senha
      </Link>
      {errors.form ? <Text style={s.formError}>{errors.form}</Text> : null}
      <Button title="Entrar" icon="log-in-outline" onPress={submit} loading={loading} />
      <View style={s.footer}>
        <Text style={s.muted}>Ainda não tem conta? </Text>
        <Link href="/cadastro" style={s.linkBold}>
          Criar conta
        </Link>
      </View>
    </AuthLayout>
  );
}

const s = StyleSheet.create({
  link: { color: colors.primary, fontWeight: '600', alignSelf: 'flex-end' },
  linkBold: { color: colors.primary, fontWeight: '700' },
  formError: { color: colors.danger, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  muted: { color: colors.muted },
});

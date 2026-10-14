import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { authErrorMessage, useAuth } from '../../auth/AuthProvider';
import { AuthLayout } from '../../components/AuthLayout';
import { colors } from '../../components/theme';
import { Button, Field } from '../../components/ui';
import { MIN_PASSWORD_LENGTH, isValidEmail } from '../../lib/validation';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Informe seu nome.';
    if (!isValidEmail(email)) e.email = 'Informe um e-mail válido.';
    if (password.length < MIN_PASSWORD_LENGTH) {
      e.password = `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    if (confirm !== password) e.confirm = 'As senhas não conferem.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      await signUp({ name, email, password });
    } catch (err) {
      setErrors({ form: authErrorMessage(err) });
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Criar conta" subtitle="Cadastre-se para começar a usar o Locattor.">
      <Field label="Nome" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" error={errors.name} />
      <Field
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        error={errors.email}
      />
      <Field
        label="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
        error={errors.password}
      />
      <Field
        label="Confirmar senha"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={submit}
        error={errors.confirm}
      />
      {errors.form ? <Text style={s.formError}>{errors.form}</Text> : null}
      <Button title="Criar conta" icon="person-add-outline" onPress={submit} loading={loading} />
      <View style={s.footer}>
        <Text style={s.muted}>Já tem conta? </Text>
        <Link href="/login" style={s.linkBold}>
          Entrar
        </Link>
      </View>
    </AuthLayout>
  );
}

const s = StyleSheet.create({
  linkBold: { color: colors.primary, fontWeight: '700' },
  formError: { color: colors.danger, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  muted: { color: colors.muted },
});

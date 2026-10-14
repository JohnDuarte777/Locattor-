import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { authErrorMessage, useAuth } from '../../auth/AuthProvider';
import { AuthLayout } from '../../components/AuthLayout';
import { colors } from '../../components/theme';
import { Button, Field } from '../../components/ui';
import { isValidEmail } from '../../lib/validation';

export default function ResetPasswordScreen() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!isValidEmail(email)) {
      setError('Informe um e-mail válido.');
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha."
    >
      {sent ? (
        <Text style={s.success}>Pronto! Se existir uma conta com este e-mail, você receberá as instruções em instantes.</Text>
      ) : (
        <>
          <Field
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            onSubmitEditing={submit}
            error={error}
          />
          <Button title="Enviar link" icon="mail-outline" onPress={submit} loading={loading} />
        </>
      )}
      <Link href="/login" style={s.link}>
        Voltar para o login
      </Link>
    </AuthLayout>
  );
}

const s = StyleSheet.create({
  link: { color: colors.primary, fontWeight: '700', textAlign: 'center' },
  success: { color: colors.success, fontSize: 15 },
});

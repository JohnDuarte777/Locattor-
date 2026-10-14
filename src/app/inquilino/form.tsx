import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button, Field, FormScreen } from '../../components/ui';
import { useStore } from '../../data/store';
import { maskDocument, maskPhone } from '../../lib/format';
import { goBack } from '../../lib/navigation';
import { newId } from '../../lib/rental';

export default function TenantForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, upsert } = useStore();
  const existing = data.tenants.find((t) => t.id === id);

  const [name, setName] = useState(existing?.name ?? '');
  const [document, setDocument] = useState(existing?.document ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Informe o nome do inquilino.';
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'E-mail inválido.';
    setErrors(e);
    if (Object.keys(e).length) return;

    upsert('tenants', {
      id: existing?.id ?? newId(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      name: name.trim(),
      document: document.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    goBack();
  };

  return (
    <FormScreen>
      <Stack.Screen options={{ title: existing ? 'Editar inquilino' : 'Novo inquilino' }} />
      <Field label="Nome completo *" value={name} onChangeText={setName} autoCapitalize="words" error={errors.name} />
      <Field label="CPF / CNPJ" value={document} onChangeText={(t) => setDocument(maskDocument(t))} keyboardType="number-pad" />
      <Field label="Telefone (WhatsApp)" value={phone} onChangeText={(t) => setPhone(maskPhone(t))} keyboardType="phone-pad" placeholder="(11) 91234-5678" />
      <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
      <Field label="Observações" value={notes} onChangeText={setNotes} multiline />
      <Button title="Salvar" icon="checkmark" onPress={save} />
    </FormScreen>
  );
}

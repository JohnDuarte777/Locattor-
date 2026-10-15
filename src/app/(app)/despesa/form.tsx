import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button, Field, FormScreen, Select } from '../../../components/ui';
import { useStore } from '../../../data/store';
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '../../../data/types';
import { currencyInput, formatDate, maskDate, parseCurrency, parseDate, today } from '../../../lib/format';
import { goBack } from '../../../lib/navigation';
import { newId } from '../../../lib/id';

export default function ExpenseForm() {
  const params = useLocalSearchParams<{ id?: string; propertyId?: string }>();
  const { data, upsert, remove } = useStore();
  const existing = data.expenses.find((e) => e.id === params.id);

  const [propertyId, setPropertyId] = useState(existing?.propertyId ?? params.propertyId);
  const [description, setDescription] = useState(existing?.description ?? '');
  const [category, setCategory] = useState<ExpenseCategory>(existing?.category ?? 'manutencao');
  const [amount, setAmount] = useState(currencyInput(existing?.amount));
  const [date, setDate] = useState(formatDate(existing?.date ?? today()));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = () => {
    const e: Record<string, string> = {};
    const amountValue = parseCurrency(amount);
    const dateValue = parseDate(date);
    if (!propertyId) e.property = 'Selecione o imóvel.';
    if (!description.trim()) e.description = 'Informe uma descrição.';
    if (!(amountValue > 0)) e.amount = 'Informe um valor válido.';
    if (!dateValue) e.date = 'Data inválida (use DD/MM/AAAA).';
    setErrors(e);
    if (Object.keys(e).length) return;

    upsert('expenses', {
      id: existing?.id ?? newId(),
      propertyId: propertyId!,
      description: description.trim(),
      category,
      amount: amountValue,
      date: dateValue!,
    });
    goBack();
  };

  const confirmDelete = () =>
    Alert.alert('Excluir despesa', 'Deseja excluir esta despesa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          goBack();
          remove('expenses', existing!.id);
        },
      },
    ]);

  return (
    <FormScreen>
      <Stack.Screen options={{ title: existing ? 'Editar despesa' : 'Nova despesa' }} />
      <Select
        label="Imóvel *"
        options={data.properties.map((p) => ({ value: p.id, label: p.name }))}
        value={propertyId}
        onChange={setPropertyId}
        error={errors.property}
      />
      <Field label="Descrição *" value={description} onChangeText={setDescription} placeholder="Ex.: Conserto do chuveiro" error={errors.description} />
      <Select label="Categoria" options={EXPENSE_CATEGORIES} value={category} onChange={setCategory} />
      <Field label="Valor (R$) *" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0,00" error={errors.amount} />
      <Field label="Data *" value={date} onChangeText={(t) => setDate(maskDate(t))} keyboardType="number-pad" placeholder="DD/MM/AAAA" error={errors.date} />
      <View style={{ gap: 12 }}>
        <Button title="Salvar" icon="checkmark" onPress={save} />
        {existing ? <Button title="Excluir despesa" icon="trash-outline" variant="danger" onPress={confirmDelete} /> : null}
      </View>
    </FormScreen>
  );
}

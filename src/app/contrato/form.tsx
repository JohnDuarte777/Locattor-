import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { Button, Field, FormScreen, Select, styles as ui } from '../../components/ui';
import { useStore } from '../../data/store';
import { currencyInput, formatDate, maskDate, parseCurrency, parseDate, today } from '../../lib/format';
import { goBack } from '../../lib/navigation';
import { newId } from '../../lib/rental';

export default function ContractForm() {
  const params = useLocalSearchParams<{ id?: string; propertyId?: string; tenantId?: string }>();
  const { data, upsert } = useStore();
  const existing = data.contracts.find((c) => c.id === params.id);

  const busy = new Set(
    data.contracts.filter((c) => c.active && c.id !== existing?.id).map((c) => c.propertyId),
  );
  const availableProperties = data.properties.filter((p) => !busy.has(p.id) || p.id === existing?.propertyId);

  const initialProperty = data.properties.find((p) => p.id === (existing?.propertyId ?? params.propertyId));
  const [propertyId, setPropertyId] = useState(initialProperty?.id);
  const [tenantId, setTenantId] = useState(existing?.tenantId ?? params.tenantId);
  const [rent, setRent] = useState(currencyInput(existing?.rent ?? initialProperty?.rent));
  const [dueDay, setDueDay] = useState(existing?.dueDay.toString() ?? '5');
  const [startDate, setStartDate] = useState(formatDate(existing?.startDate ?? today()));
  const [endDate, setEndDate] = useState(formatDate(existing?.endDate));
  const [deposit, setDeposit] = useState(currencyInput(existing?.deposit));
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectProperty = (id: string) => {
    setPropertyId(id);
    const property = data.properties.find((p) => p.id === id);
    if (property && !rent) setRent(currencyInput(property.rent));
  };

  const save = () => {
    const e: Record<string, string> = {};
    const rentValue = parseCurrency(rent);
    const dueDayValue = parseInt(dueDay, 10);
    const start = parseDate(startDate);
    const end = endDate.trim() ? parseDate(endDate) : undefined;
    const depositValue = deposit.trim() ? parseCurrency(deposit) : undefined;

    if (!propertyId) e.property = 'Selecione o imóvel.';
    if (!tenantId) e.tenant = 'Selecione o inquilino.';
    if (!(rentValue > 0)) e.rent = 'Informe um valor de aluguel válido.';
    if (!(dueDayValue >= 1 && dueDayValue <= 31)) e.dueDay = 'Informe um dia entre 1 e 31.';
    if (!start) e.startDate = 'Data inválida (use DD/MM/AAAA).';
    if (endDate.trim() && !end) e.endDate = 'Data inválida (use DD/MM/AAAA).';
    if (start && end && end <= start) e.endDate = 'O término deve ser depois do início.';
    if (depositValue !== undefined && !(depositValue >= 0)) e.deposit = 'Valor inválido.';
    setErrors(e);
    if (Object.keys(e).length) return;

    const id = existing?.id ?? newId();
    upsert('contracts', {
      id,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      propertyId: propertyId!,
      tenantId: tenantId!,
      rent: rentValue,
      dueDay: dueDayValue,
      startDate: start!,
      endDate: end,
      deposit: depositValue,
      active: existing?.active ?? true,
      notes: notes.trim() || undefined,
    });
    if (existing) goBack();
    else router.replace(`/contrato/${id}`);
  };

  return (
    <FormScreen>
      <Stack.Screen options={{ title: existing ? 'Editar contrato' : 'Novo contrato' }} />
      <Select
        label="Imóvel *"
        options={availableProperties.map((p) => ({ value: p.id, label: p.name }))}
        value={propertyId}
        onChange={selectProperty}
        error={errors.property}
      />
      {availableProperties.length === 0 ? (
        <Text style={ui.muted}>Todos os imóveis já estão alugados. Cadastre um novo imóvel ou encerre um contrato.</Text>
      ) : null}
      <Select
        label="Inquilino *"
        options={data.tenants.map((t) => ({ value: t.id, label: t.name }))}
        value={tenantId}
        onChange={setTenantId}
        error={errors.tenant}
      />
      <Button title="Cadastrar novo inquilino" icon="person-add-outline" variant="secondary" onPress={() => router.push('/inquilino/form')} />
      <Field label="Valor do aluguel (R$) *" value={rent} onChangeText={setRent} keyboardType="decimal-pad" placeholder="0,00" error={errors.rent} />
      <Field label="Dia do vencimento *" value={dueDay} onChangeText={setDueDay} keyboardType="number-pad" error={errors.dueDay} />
      <Field label="Data de início *" value={startDate} onChangeText={(t) => setStartDate(maskDate(t))} keyboardType="number-pad" placeholder="DD/MM/AAAA" error={errors.startDate} />
      <Field label="Data de término" value={endDate} onChangeText={(t) => setEndDate(maskDate(t))} keyboardType="number-pad" placeholder="DD/MM/AAAA (opcional)" error={errors.endDate} />
      <Field label="Caução / depósito (R$)" value={deposit} onChangeText={setDeposit} keyboardType="decimal-pad" placeholder="0,00" error={errors.deposit} />
      <Field label="Observações" value={notes} onChangeText={setNotes} multiline />
      <Button title="Salvar" icon="checkmark" onPress={save} />
    </FormScreen>
  );
}

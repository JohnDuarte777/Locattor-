import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button, Field, FormScreen, Select } from '../../components/ui';
import { useStore } from '../../data/store';
import { PROPERTY_TYPES, type PropertyType } from '../../data/types';
import { currencyInput, parseCurrency } from '../../lib/format';
import { goBack } from '../../lib/navigation';
import { newId } from '../../lib/rental';

export default function PropertyForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, upsert } = useStore();
  const existing = data.properties.find((p) => p.id === id);

  const [name, setName] = useState(existing?.name ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [type, setType] = useState<PropertyType>(existing?.type ?? 'apartamento');
  const [rent, setRent] = useState(currencyInput(existing?.rent));
  const [bedrooms, setBedrooms] = useState(existing?.bedrooms?.toString() ?? '');
  const [area, setArea] = useState(existing?.area?.toString() ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = () => {
    const rentValue = parseCurrency(rent);
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Informe um nome para o imóvel.';
    if (!address.trim()) e.address = 'Informe o endereço.';
    if (!(rentValue > 0)) e.rent = 'Informe um valor de aluguel válido.';
    setErrors(e);
    if (Object.keys(e).length) return;

    const bedroomsValue = parseInt(bedrooms, 10);
    const areaValue = parseCurrency(area);
    upsert('properties', {
      id: existing?.id ?? newId(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      name: name.trim(),
      address: address.trim(),
      type,
      rent: rentValue,
      bedrooms: Number.isNaN(bedroomsValue) ? undefined : bedroomsValue,
      area: Number.isNaN(areaValue) ? undefined : areaValue,
      notes: notes.trim() || undefined,
    });
    goBack();
  };

  return (
    <FormScreen>
      <Stack.Screen options={{ title: existing ? 'Editar imóvel' : 'Novo imóvel' }} />
      <Field label="Nome / identificação *" value={name} onChangeText={setName} placeholder="Ex.: Apto 302 - Ed. Solar" error={errors.name} />
      <Field label="Endereço *" value={address} onChangeText={setAddress} placeholder="Rua, número, bairro, cidade" error={errors.address} />
      <Select label="Tipo" options={PROPERTY_TYPES} value={type} onChange={setType} />
      <Field label="Valor do aluguel (R$) *" value={rent} onChangeText={setRent} keyboardType="decimal-pad" placeholder="0,00" error={errors.rent} />
      <Field label="Quartos" value={bedrooms} onChangeText={setBedrooms} keyboardType="number-pad" />
      <Field label="Área (m²)" value={area} onChangeText={setArea} keyboardType="decimal-pad" />
      <Field label="Observações" value={notes} onChangeText={setNotes} multiline />
      <Button title="Salvar" icon="checkmark" onPress={save} />
    </FormScreen>
  );
}

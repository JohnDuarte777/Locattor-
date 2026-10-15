import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, Text, View } from 'react-native';

import { colors } from '../../../components/theme';
import { Badge, Button, Card, Empty, InfoRow, SectionTitle, styles as ui } from '../../../components/ui';
import { useStore } from '../../../data/store';
import { EXPENSE_CATEGORIES, PROPERTY_TYPES } from '../../../data/types';
import { formatCurrency, formatDate } from '../../../lib/format';
import { goBack } from '../../../lib/navigation';
import { activeContractForProperty } from '../../../lib/rental';

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, removeProperty } = useStore();
  const property = data.properties.find((p) => p.id === id);

  if (!property) {
    return <Empty icon="alert-circle-outline" title="Imóvel não encontrado" />;
  }

  const contract = activeContractForProperty(data, property.id);
  const tenant = contract && data.tenants.find((t) => t.id === contract.tenantId);
  const pastContracts = data.contracts.filter((c) => c.propertyId === property.id && !c.active);
  const expenses = data.expenses
    .filter((e) => e.propertyId === property.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const received = data.payments
    .filter((p) => p.paidAt && data.contracts.some((c) => c.id === p.contractId && c.propertyId === property.id))
    .reduce((sum, p) => sum + p.amount, 0);

  const confirmDelete = () =>
    Alert.alert(
      'Excluir imóvel',
      'Isso também exclui os contratos, cobranças e despesas deste imóvel. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            goBack();
            removeProperty(property.id);
          },
        },
      ],
    );

  const details = [
    PROPERTY_TYPES.find((t) => t.value === property.type)?.label,
    property.bedrooms ? `${property.bedrooms} quarto(s)` : undefined,
    property.area ? `${property.area} m²` : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Stack.Screen options={{ title: property.name }} />
      <Card>
        <View style={ui.row}>
          <Text style={[ui.title, ui.flex]}>{property.name}</Text>
          {contract ? <Badge label="Alugado" tone="success" /> : <Badge label="Vago" tone="neutral" />}
        </View>
        <InfoRow icon="location-outline" label="Endereço" value={property.address} />
        <InfoRow icon="home-outline" label="Características" value={details} />
        <InfoRow icon="pricetag-outline" label="Aluguel de referência" value={formatCurrency(property.rent)} />
        <InfoRow icon="document-outline" label="Observações" value={property.notes} />
      </Card>

      <Card>
        <View style={ui.row}>
          <Text style={ui.muted}>Total recebido</Text>
          <Text style={[ui.amount, { color: colors.success }]}>{formatCurrency(received)}</Text>
        </View>
        <View style={ui.row}>
          <Text style={ui.muted}>Total de despesas</Text>
          <Text style={[ui.amount, { color: colors.danger }]}>{formatCurrency(totalExpenses)}</Text>
        </View>
      </Card>

      <SectionTitle>Contrato atual</SectionTitle>
      {contract ? (
        <Card onPress={() => router.push(`/contrato/${contract.id}`)}>
          <Text style={ui.title}>{tenant?.name}</Text>
          <Text style={ui.muted}>
            {formatCurrency(contract.rent)} · vence todo dia {contract.dueDay}
          </Text>
          <Text style={ui.muted}>Desde {formatDate(contract.startDate)}</Text>
        </Card>
      ) : (
        <Button
          title="Alugar este imóvel"
          icon="key-outline"
          variant="secondary"
          onPress={() => router.push({ pathname: '/contrato/form', params: { propertyId: property.id } })}
        />
      )}

      {pastContracts.length > 0 ? (
        <>
          <SectionTitle>Contratos anteriores</SectionTitle>
          {pastContracts.map((c) => (
            <Card key={c.id} onPress={() => router.push(`/contrato/${c.id}`)}>
              <Text style={ui.title}>{data.tenants.find((t) => t.id === c.tenantId)?.name}</Text>
              <Text style={ui.muted}>
                {formatDate(c.startDate)} {c.endDate ? `até ${formatDate(c.endDate)}` : ''}
              </Text>
            </Card>
          ))}
        </>
      ) : null}

      <SectionTitle
        action={
          <Text
            style={{ color: colors.primary, fontWeight: '600' }}
            onPress={() => router.push({ pathname: '/despesa/form', params: { propertyId: property.id } })}
          >
            + Adicionar
          </Text>
        }
      >
        Despesas
      </SectionTitle>
      {expenses.length === 0 ? (
        <Card>
          <Text style={ui.muted}>Nenhuma despesa registrada.</Text>
        </Card>
      ) : (
        expenses.map((e) => (
          <Card key={e.id} onPress={() => router.push({ pathname: '/despesa/form', params: { id: e.id } })}>
            <View style={ui.row}>
              <Text style={[ui.title, ui.flex]} numberOfLines={1}>{e.description}</Text>
              <Text style={[ui.amount, { color: colors.danger }]}>{formatCurrency(e.amount)}</Text>
            </View>
            <Text style={ui.muted}>
              {EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label} · {formatDate(e.date)}
            </Text>
          </Card>
        ))
      )}

      <View style={{ gap: 12, marginTop: 12 }}>
        <Button
          title="Editar imóvel"
          icon="create-outline"
          variant="secondary"
          onPress={() => router.push({ pathname: '/imovel/form', params: { id: property.id } })}
        />
        <Button title="Excluir imóvel" icon="trash-outline" variant="danger" onPress={confirmDelete} />
      </View>
    </ScrollView>
  );
}

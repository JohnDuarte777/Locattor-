import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, Text, View } from 'react-native';

import { PaymentCard } from '../../components/PaymentCard';
import { colors } from '../../components/theme';
import { Badge, Button, Card, Empty, InfoRow, SectionTitle, styles as ui } from '../../components/ui';
import { useStore } from '../../data/store';
import { formatCurrency, formatDate, today } from '../../lib/format';
import { goBack } from '../../lib/navigation';
import { activeContractForProperty, paymentStatus } from '../../lib/rental';

export default function ContractDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, upsert, removeContract } = useStore();
  const contract = data.contracts.find((c) => c.id === id);

  if (!contract) {
    return <Empty icon="alert-circle-outline" title="Contrato não encontrado" />;
  }

  const property = data.properties.find((p) => p.id === contract.propertyId);
  const tenant = data.tenants.find((t) => t.id === contract.tenantId);
  const payments = data.payments
    .filter((p) => p.contractId === contract.id)
    .sort((a, b) => b.month.localeCompare(a.month));
  const todayISO = today();
  const debt = payments
    .filter((p) => paymentStatus(p, todayISO) === 'atrasado')
    .reduce((sum, p) => sum + p.amount, 0);
  const received = payments.filter((p) => p.paidAt).reduce((sum, p) => sum + p.amount, 0);

  const endContract = () =>
    Alert.alert(
      'Encerrar contrato',
      'Novas cobranças deixarão de ser geradas. Cobranças em aberto continuam registradas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: () =>
            upsert('contracts', {
              ...contract,
              active: false,
              endDate: contract.endDate && contract.endDate < todayISO ? contract.endDate : todayISO,
            }),
        },
      ],
    );

  const reactivate = () => {
    const other = activeContractForProperty(data, contract.propertyId);
    if (other) {
      Alert.alert('Imóvel ocupado', 'Este imóvel já possui outro contrato ativo.');
      return;
    }
    upsert('contracts', { ...contract, active: true });
  };

  const confirmDelete = () =>
    Alert.alert('Excluir contrato', 'O contrato e todas as suas cobranças serão excluídos.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          goBack();
          removeContract(contract.id);
        },
      },
    ]);

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Stack.Screen options={{ title: 'Contrato' }} />
      <Card>
        <View style={ui.row}>
          <Text style={[ui.title, ui.flex]}>{property?.name ?? 'Imóvel removido'}</Text>
          {contract.active ? <Badge label="Ativo" tone="success" /> : <Badge label="Encerrado" tone="neutral" />}
        </View>
        <InfoRow icon="person-outline" label="Inquilino" value={tenant?.name} />
        <InfoRow icon="cash-outline" label="Aluguel" value={`${formatCurrency(contract.rent)} · vence todo dia ${contract.dueDay}`} />
        <InfoRow
          icon="calendar-outline"
          label="Vigência"
          value={`${formatDate(contract.startDate)} ${contract.endDate ? `até ${formatDate(contract.endDate)}` : '· prazo indeterminado'}`}
        />
        <InfoRow icon="shield-checkmark-outline" label="Caução" value={contract.deposit ? formatCurrency(contract.deposit) : undefined} />
        <InfoRow icon="document-outline" label="Observações" value={contract.notes} />
      </Card>

      <Card>
        <View style={ui.row}>
          <Text style={ui.muted}>Total recebido</Text>
          <Text style={[ui.amount, { color: colors.success }]}>{formatCurrency(received)}</Text>
        </View>
        <View style={ui.row}>
          <Text style={ui.muted}>Em atraso</Text>
          <Text style={[ui.amount, { color: debt ? colors.danger : colors.text }]}>{formatCurrency(debt)}</Text>
        </View>
      </Card>

      <SectionTitle>Cobranças</SectionTitle>
      {payments.length === 0 ? (
        <Card>
          <Text style={ui.muted}>
            Nenhuma cobrança ainda. A primeira será gerada no mês do primeiro vencimento.
          </Text>
        </Card>
      ) : (
        payments.map((p) => <PaymentCard key={p.id} payment={p} tenant={tenant} property={property} />)
      )}

      <View style={{ gap: 12, marginTop: 12 }}>
        <Button
          title="Editar contrato"
          icon="create-outline"
          variant="secondary"
          onPress={() => router.push({ pathname: '/contrato/form', params: { id: contract.id } })}
        />
        {contract.active ? (
          <Button title="Encerrar contrato" icon="stop-circle-outline" variant="secondary" onPress={endContract} />
        ) : (
          <Button title="Reativar contrato" icon="play-circle-outline" variant="secondary" onPress={reactivate} />
        )}
        <Button title="Excluir contrato" icon="trash-outline" variant="danger" onPress={confirmDelete} />
      </View>
    </ScrollView>
  );
}

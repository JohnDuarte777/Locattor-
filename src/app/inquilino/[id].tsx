import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';

import { Badge, Button, Card, Empty, InfoRow, SectionTitle, styles as ui } from '../../components/ui';
import { useStore } from '../../data/store';
import { formatCurrency, formatDate } from '../../lib/format';
import { goBack } from '../../lib/navigation';
import { callPhone, openWhatsApp } from '../../lib/whatsapp';

export default function TenantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, removeTenant } = useStore();
  const tenant = data.tenants.find((t) => t.id === id);

  if (!tenant) {
    return <Empty icon="alert-circle-outline" title="Inquilino não encontrado" />;
  }

  const contracts = data.contracts
    .filter((c) => c.tenantId === tenant.id)
    .sort((a, b) => Number(b.active) - Number(a.active) || b.startDate.localeCompare(a.startDate));

  const confirmDelete = () =>
    Alert.alert(
      'Excluir inquilino',
      'Isso também exclui os contratos e cobranças deste inquilino. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            goBack();
            removeTenant(tenant.id);
          },
        },
      ],
    );

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      <Stack.Screen options={{ title: tenant.name }} />
      <Card>
        <Text style={ui.title}>{tenant.name}</Text>
        <InfoRow icon="card-outline" label="CPF / CNPJ" value={tenant.document} />
        <InfoRow icon="call-outline" label="Telefone" value={tenant.phone} />
        <InfoRow icon="mail-outline" label="E-mail" value={tenant.email} />
        <InfoRow icon="document-outline" label="Observações" value={tenant.notes} />
      </Card>

      {tenant.phone ? (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={ui.flex}>
            <Button title="Ligar" icon="call-outline" variant="secondary" onPress={() => callPhone(tenant.phone!)} />
          </View>
          <View style={ui.flex}>
            <Button
              title="WhatsApp"
              icon="logo-whatsapp"
              variant="secondary"
              onPress={() => openWhatsApp(tenant.phone, `Olá, ${tenant.name.split(' ')[0]}!`)}
            />
          </View>
        </View>
      ) : null}
      {tenant.email ? (
        <Button
          title="Enviar e-mail"
          icon="mail-outline"
          variant="secondary"
          onPress={() => Linking.openURL(`mailto:${tenant.email}`).catch(() => {})}
        />
      ) : null}

      <SectionTitle>Contratos</SectionTitle>
      {contracts.length === 0 ? (
        <Card>
          <Text style={ui.muted}>Nenhum contrato.</Text>
        </Card>
      ) : (
        contracts.map((c) => (
          <Card key={c.id} onPress={() => router.push(`/contrato/${c.id}`)}>
            <View style={ui.row}>
              <Text style={[ui.title, ui.flex]} numberOfLines={1}>
                {data.properties.find((p) => p.id === c.propertyId)?.name}
              </Text>
              {c.active ? <Badge label="Ativo" tone="success" /> : <Badge label="Encerrado" tone="neutral" />}
            </View>
            <Text style={ui.muted}>
              {formatCurrency(c.rent)} · desde {formatDate(c.startDate)}
            </Text>
          </Card>
        ))
      )}
      <Button
        title="Novo contrato"
        icon="add"
        variant="secondary"
        onPress={() => router.push({ pathname: '/contrato/form', params: { tenantId: tenant.id } })}
      />

      <View style={{ gap: 12, marginTop: 12 }}>
        <Button
          title="Editar inquilino"
          icon="create-outline"
          variant="secondary"
          onPress={() => router.push({ pathname: '/inquilino/form', params: { id: tenant.id } })}
        />
        <Button title="Excluir inquilino" icon="trash-outline" variant="danger" onPress={confirmDelete} />
      </View>
    </ScrollView>
  );
}

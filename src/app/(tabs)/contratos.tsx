import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { Badge, Card, Empty, Fab, Select, styles as ui } from '../../components/ui';
import { useStore } from '../../data/store';
import { formatCurrency, formatDate } from '../../lib/format';

type Filter = 'ativos' | 'encerrados';

export default function ContractsScreen() {
  const { data } = useStore();
  const [filter, setFilter] = useState<Filter>('ativos');

  const tenants = useMemo(() => new Map(data.tenants.map((t) => [t.id, t])), [data.tenants]);
  const properties = useMemo(() => new Map(data.properties.map((p) => [p.id, p])), [data.properties]);
  const items = useMemo(
    () =>
      data.contracts
        .filter((c) => (filter === 'ativos' ? c.active : !c.active))
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [data.contracts, filter],
  );

  return (
    <View style={ui.flex}>
      <FlatList
        style={ui.screen}
        contentContainerStyle={ui.content}
        data={items}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={
          <Select<Filter>
            label="Mostrar"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'ativos', label: 'Ativos' },
              { value: 'encerrados', label: 'Encerrados' },
            ]}
          />
        }
        ListEmptyComponent={
          <Empty
            icon="document-text-outline"
            title={filter === 'ativos' ? 'Nenhum contrato ativo' : 'Nenhum contrato encerrado'}
            subtitle={filter === 'ativos' ? 'Toque no botão + para criar um contrato.' : undefined}
          />
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/contrato/${item.id}`)}>
            <View style={ui.row}>
              <Text style={[ui.title, ui.flex]} numberOfLines={1}>
                {properties.get(item.propertyId)?.name ?? 'Imóvel removido'}
              </Text>
              {item.active ? <Badge label="Ativo" tone="success" /> : <Badge label="Encerrado" tone="neutral" />}
            </View>
            <Text style={ui.muted} numberOfLines={1}>
              {tenants.get(item.tenantId)?.name ?? 'Inquilino removido'}
            </Text>
            <View style={ui.row}>
              <Text style={ui.muted}>
                {formatDate(item.startDate)}
                {item.endDate ? ` até ${formatDate(item.endDate)}` : ' · prazo indeterminado'}
              </Text>
              <Text style={ui.amount}>{formatCurrency(item.rent)}</Text>
            </View>
          </Card>
        )}
      />
      <Fab onPress={() => router.push('/contrato/form')} />
    </View>
  );
}

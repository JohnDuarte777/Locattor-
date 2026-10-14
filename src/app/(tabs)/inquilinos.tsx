import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';

import { colors } from '../../components/theme';
import { Badge, Card, Empty, Fab, styles as ui } from '../../components/ui';
import { useStore } from '../../data/store';
import { today } from '../../lib/format';
import { paymentStatus } from '../../lib/rental';

export default function TenantsScreen() {
  const { data } = useStore();
  const [query, setQuery] = useState('');
  const todayISO = today();

  const overdueTenants = useMemo(() => {
    const contracts = new Map(data.contracts.map((c) => [c.id, c]));
    const set = new Set<string>();
    for (const p of data.payments) {
      if (paymentStatus(p, todayISO) !== 'atrasado') continue;
      const c = contracts.get(p.contractId);
      if (c) set.add(c.tenantId);
    }
    return set;
  }, [data.contracts, data.payments, todayISO]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.tenants
      .filter((t) => !q || t.name.toLowerCase().includes(q) || (t.phone ?? '').includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.tenants, query]);

  return (
    <View style={ui.flex}>
      <FlatList
        style={ui.screen}
        contentContainerStyle={ui.content}
        data={items}
        keyExtractor={(t) => t.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          data.tenants.length > 0 ? (
            <TextInput
              style={ui.search}
              placeholder="Buscar por nome ou telefone"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
            />
          ) : null
        }
        ListEmptyComponent={
          <Empty
            icon="people-outline"
            title={query ? 'Nenhum inquilino encontrado' : 'Nenhum inquilino cadastrado'}
            subtitle={query ? undefined : 'Toque no botão + para cadastrar.'}
          />
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/inquilino/${item.id}`)}>
            <View style={ui.row}>
              <Text style={[ui.title, ui.flex]} numberOfLines={1}>{item.name}</Text>
              {overdueTenants.has(item.id) ? <Badge label="Em atraso" tone="danger" /> : null}
            </View>
            {item.phone ? <Text style={ui.muted}>{item.phone}</Text> : null}
          </Card>
        )}
      />
      <Fab onPress={() => router.push('/inquilino/form')} />
    </View>
  );
}

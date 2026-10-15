import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';

import { colors } from '../../../components/theme';
import { Badge, Card, Empty, Fab, styles as ui } from '../../../components/ui';
import { useStore } from '../../../data/store';
import { PROPERTY_TYPES } from '../../../data/types';
import { formatCurrency } from '../../../lib/format';

export default function PropertiesScreen() {
  const { data } = useStore();
  const [query, setQuery] = useState('');

  const rented = useMemo(
    () => new Set(data.contracts.filter((c) => c.active).map((c) => c.propertyId)),
    [data.contracts],
  );
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.properties
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.properties, query]);

  return (
    <View style={ui.flex}>
      <FlatList
        style={ui.screen}
        contentContainerStyle={ui.content}
        data={items}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          data.properties.length > 0 ? (
            <TextInput
              style={ui.search}
              placeholder="Buscar por nome ou endereço"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
            />
          ) : null
        }
        ListEmptyComponent={
          <Empty
            icon="business-outline"
            title={query ? 'Nenhum imóvel encontrado' : 'Nenhum imóvel cadastrado'}
            subtitle={query ? undefined : 'Toque no botão + para cadastrar.'}
          />
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/imovel/${item.id}`)}>
            <View style={ui.row}>
              <Text style={[ui.title, ui.flex]} numberOfLines={1}>{item.name}</Text>
              {rented.has(item.id) ? <Badge label="Alugado" tone="success" /> : <Badge label="Vago" tone="neutral" />}
            </View>
            <Text style={ui.muted} numberOfLines={1}>{item.address}</Text>
            <View style={ui.row}>
              <Text style={ui.muted}>{PROPERTY_TYPES.find((t) => t.value === item.type)?.label}</Text>
              <Text style={ui.amount}>{formatCurrency(item.rent)}</Text>
            </View>
          </Card>
        )}
      />
      <Fab onPress={() => router.push('/imovel/form')} />
    </View>
  );
}

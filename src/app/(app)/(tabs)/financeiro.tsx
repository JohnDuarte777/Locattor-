import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PaymentCard } from '../../../components/PaymentCard';
import { colors, spacing } from '../../../components/theme';
import { Card, Empty, Fab, Select, styles as ui } from '../../../components/ui';
import { useStore } from '../../../data/store';
import { EXPENSE_CATEGORIES } from '../../../data/types';
import { addMonths, currentMonth, formatCurrency, formatDate, formatMonth, today } from '../../../lib/format';
import { monthSummary } from '../../../lib/rental';

type Tab = 'alugueis' | 'despesas';

export default function FinanceScreen() {
  const { data } = useStore();
  const [month, setMonth] = useState(currentMonth());
  const [tab, setTab] = useState<Tab>('alugueis');

  const summary = useMemo(() => monthSummary(data, month, today()), [data, month]);
  const contracts = useMemo(() => new Map(data.contracts.map((c) => [c.id, c])), [data.contracts]);
  const tenants = useMemo(() => new Map(data.tenants.map((t) => [t.id, t])), [data.tenants]);
  const properties = useMemo(() => new Map(data.properties.map((p) => [p.id, p])), [data.properties]);

  const payments = data.payments
    .filter((p) => p.month === month)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const expenses = data.expenses
    .filter((e) => e.date.slice(0, 7) === month)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <View style={ui.flex}>
      <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
        <View style={s.monthNav}>
          <Pressable onPress={() => setMonth(addMonths(month, -1))} hitSlop={12} accessibilityLabel="Mês anterior">
            <Ionicons name="chevron-back" size={26} color={colors.primary} />
          </Pressable>
          <Text style={s.monthText}>{formatMonth(month)}</Text>
          <Pressable onPress={() => setMonth(addMonths(month, 1))} hitSlop={12} accessibilityLabel="Próximo mês">
            <Ionicons name="chevron-forward" size={26} color={colors.primary} />
          </Pressable>
        </View>

        <Card>
          <SummaryLine label="Aluguéis previstos" value={summary.expected} />
          <SummaryLine label="Recebido" value={summary.received} color={colors.success} />
          <SummaryLine label="A receber" value={summary.expected - summary.received} color={colors.warning} />
          <SummaryLine label="Despesas" value={-summary.expenses} color={colors.danger} />
          <View style={s.divider} />
          <SummaryLine label="Resultado (recebido − despesas)" value={summary.received - summary.expenses} bold />
        </Card>

        <Select<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'alugueis', label: `Aluguéis (${payments.length})` },
            { value: 'despesas', label: `Despesas (${expenses.length})` },
          ]}
        />

        {tab === 'alugueis' ? (
          payments.length === 0 ? (
            <Empty
              icon="cash-outline"
              title="Nenhuma cobrança neste mês"
              subtitle="As cobranças são geradas automaticamente a partir dos contratos ativos."
            />
          ) : (
            payments.map((p) => {
              const c = contracts.get(p.contractId);
              const tenant = c && tenants.get(c.tenantId);
              const property = c && properties.get(c.propertyId);
              return (
                <PaymentCard
                  key={p.id}
                  payment={p}
                  tenant={tenant}
                  property={property}
                  title={`${property?.name ?? 'Imóvel'} · ${tenant?.name ?? 'Inquilino'}`}
                  onPress={() => router.push(`/contrato/${p.contractId}`)}
                />
              );
            })
          )
        ) : expenses.length === 0 ? (
          <Empty icon="receipt-outline" title="Nenhuma despesa neste mês" subtitle="Toque no botão + para registrar." />
        ) : (
          expenses.map((e) => (
            <Card key={e.id} onPress={() => router.push({ pathname: '/despesa/form', params: { id: e.id } })}>
              <View style={ui.row}>
                <Text style={[ui.title, ui.flex]} numberOfLines={1}>{e.description}</Text>
                <Text style={[ui.amount, { color: colors.danger }]}>{formatCurrency(e.amount)}</Text>
              </View>
              <Text style={ui.muted} numberOfLines={1}>
                {properties.get(e.propertyId)?.name} · {EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label} ·{' '}
                {formatDate(e.date)}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
      {tab === 'despesas' ? <Fab onPress={() => router.push('/despesa/form')} /> : null}
    </View>
  );
}

function SummaryLine({ label, value, color, bold }: { label: string; value: number; color?: string; bold?: boolean }) {
  return (
    <View style={ui.row}>
      <Text style={[bold ? ui.title : ui.muted, ui.flex]}>{label}</Text>
      <Text style={[bold ? ui.amount : s.value, color ? { color } : null]}>{formatCurrency(value)}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthText: { fontSize: 18, fontWeight: '700', color: colors.text },
  value: { fontSize: 15, color: colors.text, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm },
});

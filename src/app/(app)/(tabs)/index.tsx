import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../../auth/AuthProvider';
import { colors, spacing } from '../../../components/theme';
import { Card, Empty, SectionTitle, StatusBadge, styles as ui, type IconName } from '../../../components/ui';
import { useStore } from '../../../data/store';
import { currentMonth, formatCurrency, formatDate, formatMonth, today } from '../../../lib/format';
import { monthSummary, overduePayments, paymentStatus } from '../../../lib/rental';
import { chargeMessage, openWhatsApp } from '../../../lib/whatsapp';

function Stat({ icon, label, value, color }: { icon: IconName; label: string; value: string; color: string }) {
  return (
    <Card style={s.stat}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[s.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={ui.muted}>{label}</Text>
    </Card>
  );
}

export default function Dashboard() {
  const { data, error } = useStore();
  const { user } = useAuth();
  const firstName = user?.name.split(' ')[0];
  const month = currentMonth();
  const todayISO = today();

  const summary = useMemo(() => monthSummary(data, month, todayISO), [data, month, todayISO]);
  const overdue = useMemo(() => overduePayments(data, todayISO), [data, todayISO]);
  const upcoming = useMemo(
    () =>
      data.payments
        .filter((p) => paymentStatus(p, todayISO) === 'pendente')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5),
    [data.payments, todayISO],
  );

  const rented = new Set(data.contracts.filter((c) => c.active).map((c) => c.propertyId));
  const occupied = data.properties.filter((p) => rented.has(p.id)).length;
  const occupancy = data.properties.length ? Math.round((occupied / data.properties.length) * 100) : 0;

  const contracts = new Map(data.contracts.map((c) => [c.id, c]));
  const tenants = new Map(data.tenants.map((t) => [t.id, t]));
  const properties = new Map(data.properties.map((p) => [p.id, p]));

  const describe = (contractId: string) => {
    const c = contracts.get(contractId);
    return { tenant: c && tenants.get(c.tenantId), property: c && properties.get(c.propertyId) };
  };

  if (data.properties.length === 0) {
    return (
      <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
        <Empty
          icon="business-outline"
          title={`Bem-vindo ao Locattor${firstName ? `, ${firstName}` : ''}!`}
          subtitle="Comece cadastrando seus imóveis e inquilinos. Depois crie um contrato e as cobranças mensais serão geradas automaticamente."
        />
        <Card onPress={() => router.push('/imovel/form')} style={s.cta}>
          <Ionicons name="add-circle" size={24} color={colors.primary} />
          <Text style={ui.title}>Cadastrar primeiro imóvel</Text>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
      {error ? (
        <Card style={s.errorCard}>
          <Text style={{ color: colors.danger }}>{error}</Text>
        </Card>
      ) : null}
      {firstName ? <Text style={ui.muted}>Olá, {firstName}!</Text> : null}
      <Text style={s.month}>{formatMonth(month)}</Text>
      <View style={s.grid}>
        <Stat icon="trending-up" label="Previsto no mês" value={formatCurrency(summary.expected)} color={colors.primary} />
        <Stat icon="checkmark-circle" label="Recebido" value={formatCurrency(summary.received)} color={colors.success} />
        <Stat icon="alert-circle" label="Em atraso (mês)" value={formatCurrency(summary.overdue)} color={colors.danger} />
        <Stat icon="wallet" label="Saldo (recebido − despesas)" value={formatCurrency(summary.received - summary.expenses)} color={colors.text} />
      </View>

      <Card>
        <View style={ui.row}>
          <Text style={ui.title}>Ocupação</Text>
          <Text style={ui.amount}>{occupancy}%</Text>
        </View>
        <View style={s.bar}>
          <View style={[s.barFill, { width: `${occupancy}%` }]} />
        </View>
        <Text style={ui.muted}>
          {occupied} de {data.properties.length} imóveis alugados
        </Text>
      </Card>

      <SectionTitle>Aluguéis em atraso ({overdue.length})</SectionTitle>
      {overdue.length === 0 ? (
        <Card>
          <Text style={ui.muted}>Nenhum aluguel em atraso. 🎉</Text>
        </Card>
      ) : (
        overdue.map((p) => {
          const { tenant, property } = describe(p.contractId);
          return (
            <Card key={p.id} onPress={() => router.push(`/contrato/${p.contractId}`)}>
              <View style={ui.row}>
                <Text style={[ui.title, ui.flex]} numberOfLines={1}>{tenant?.name ?? 'Inquilino removido'}</Text>
                <Text style={[ui.amount, { color: colors.danger }]}>{formatCurrency(p.amount)}</Text>
              </View>
              <Text style={ui.muted} numberOfLines={1}>
                {property?.name} · venceu em {formatDate(p.dueDate)}
              </Text>
              {tenant ? (
                <Text
                  style={s.link}
                  onPress={() => openWhatsApp(tenant.phone, chargeMessage(tenant, property, p))}
                >
                  <Ionicons name="logo-whatsapp" size={14} /> Cobrar pelo WhatsApp
                </Text>
              ) : null}
            </Card>
          );
        })
      )}

      <SectionTitle>Próximos vencimentos</SectionTitle>
      {upcoming.length === 0 ? (
        <Card>
          <Text style={ui.muted}>Nenhuma cobrança pendente.</Text>
        </Card>
      ) : (
        upcoming.map((p) => {
          const { tenant, property } = describe(p.contractId);
          return (
            <Card key={p.id} onPress={() => router.push(`/contrato/${p.contractId}`)}>
              <View style={ui.row}>
                <Text style={[ui.title, ui.flex]} numberOfLines={1}>{tenant?.name}</Text>
                <StatusBadge status="pendente" />
              </View>
              <View style={ui.row}>
                <Text style={[ui.muted, ui.flex]} numberOfLines={1}>
                  {property?.name} · {formatDate(p.dueDate)}
                </Text>
                <Text style={ui.amount}>{formatCurrency(p.amount)}</Text>
              </View>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  month: { fontSize: 20, fontWeight: '700', color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  stat: { flexBasis: '47%', flexGrow: 1 },
  statValue: { fontSize: 18, fontWeight: '700', marginTop: spacing.xs },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden', marginVertical: spacing.xs },
  barFill: { height: 8, backgroundColor: colors.primary },
  link: { color: colors.success, fontWeight: '600', marginTop: spacing.xs },
  errorCard: { backgroundColor: colors.dangerLight, borderColor: colors.danger },
  cta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});

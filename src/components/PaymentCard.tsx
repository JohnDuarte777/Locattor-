import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useStore } from '../data/store';
import type { Payment, Property, Tenant } from '../data/types';
import { formatCurrency, formatDate, formatMonth, today } from '../lib/format';
import { paymentStatus } from '../lib/rental';
import { chargeMessage, openWhatsApp } from '../lib/whatsapp';
import { colors, spacing } from './theme';
import { Card, StatusBadge, styles as ui } from './ui';

export function PaymentCard({
  payment,
  tenant,
  property,
  title,
  onPress,
}: {
  payment: Payment;
  tenant?: Tenant;
  property?: Property;
  title?: string;
  onPress?: () => void;
}) {
  const { upsert } = useStore();
  const status = paymentStatus(payment, today());

  const togglePaid = () => {
    if (payment.paidAt) {
      Alert.alert('Desfazer pagamento', 'Marcar esta cobrança como não paga?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desfazer', style: 'destructive', onPress: () => upsert('payments', { ...payment, paidAt: undefined }) },
      ]);
    } else {
      upsert('payments', { ...payment, paidAt: today() });
    }
  };

  return (
    <Card onPress={onPress}>
      <View style={ui.row}>
        <Text style={[ui.title, ui.flex]} numberOfLines={1}>
          {title ?? formatMonth(payment.month)}
        </Text>
        <StatusBadge status={status} />
      </View>
      <View style={ui.row}>
        <Text style={[ui.muted, ui.flex]} numberOfLines={1}>
          {payment.paidAt ? `Pago em ${formatDate(payment.paidAt)}` : `Vence em ${formatDate(payment.dueDate)}`}
        </Text>
        <Text style={ui.amount}>{formatCurrency(payment.amount)}</Text>
      </View>
      <View style={s.actions}>
        <Pressable onPress={togglePaid} style={s.action} hitSlop={8}>
          <Ionicons
            name={payment.paidAt ? 'arrow-undo-outline' : 'checkmark-circle-outline'}
            size={18}
            color={payment.paidAt ? colors.muted : colors.primary}
          />
          <Text style={[s.actionText, { color: payment.paidAt ? colors.muted : colors.primary }]}>
            {payment.paidAt ? 'Desfazer' : 'Marcar como pago'}
          </Text>
        </Pressable>
        {!payment.paidAt && tenant ? (
          <Pressable
            onPress={() => openWhatsApp(tenant.phone, chargeMessage(tenant, property, payment))}
            style={s.action}
            hitSlop={8}
          >
            <Ionicons name="logo-whatsapp" size={18} color={colors.success} />
            <Text style={[s.actionText, { color: colors.success }]}>Cobrar</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.sm },
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  actionText: { fontSize: 14, fontWeight: '600' },
});

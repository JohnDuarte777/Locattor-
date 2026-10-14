import { Alert, Linking } from 'react-native';

import type { Payment, Property, Tenant } from '../data/types';
import { formatCurrency, formatDate, formatMonth } from './format';

export function chargeMessage(tenant: Tenant, property: Property | undefined, payment: Payment): string {
  const firstName = tenant.name.split(' ')[0];
  return (
    `Olá, ${firstName}! Passando para lembrar do aluguel de ${formatMonth(payment.month)}` +
    `${property ? ` do imóvel ${property.name}` : ''}, ` +
    `no valor de ${formatCurrency(payment.amount)}, com vencimento em ${formatDate(payment.dueDate)}. Obrigado!`
  );
}

/** Abre uma conversa no WhatsApp. Números sem DDI recebem +55. */
export async function openWhatsApp(phone: string | undefined, text: string): Promise<void> {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) {
    Alert.alert('Sem telefone', 'Cadastre o telefone do inquilino para enviar mensagens.');
    return;
  }
  const number = digits.length <= 11 ? `55${digits}` : digits;
  const url = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
  }
}

export async function callPhone(phone: string): Promise<void> {
  try {
    await Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);
  } catch {
    Alert.alert('Erro', 'Não foi possível iniciar a ligação.');
  }
}

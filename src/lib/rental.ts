import type { AppData, Contract, Payment, PaymentStatus } from '../data/types';
import { addMonths } from './format';
import { newId } from './id';

function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

/** Data de vencimento (AAAA-MM-DD) de um mês de referência. */
export function dueDateFor(month: string, dueDay: number): string {
  const day = Math.min(dueDay, daysInMonth(month));
  return `${month}-${String(day).padStart(2, '0')}`;
}

/**
 * Primeiro mês cobrado de um contrato: o mês de início, se o vencimento cair
 * no próprio mês após a data de início; caso contrário, o mês seguinte.
 */
export function firstBillingMonth(contract: Contract): string {
  const startMonth = contract.startDate.slice(0, 7);
  const startDay = Number(contract.startDate.slice(8, 10));
  return contract.dueDay >= startDay ? startMonth : addMonths(startMonth, 1);
}

/**
 * Cria as cobranças que faltam para os contratos ativos, do primeiro mês de
 * cobrança até `untilMonth` (inclusive), respeitando a data de término.
 * Cobranças ainda não pagas acompanham o valor atual do contrato.
 * Retorna a mesma lista se nada mudou.
 */
export function syncPayments(data: AppData, untilMonth: string): Payment[] {
  let changed = false;
  const existing = new Set(data.payments.map((p) => `${p.contractId}|${p.month}`));
  const contractsById = new Map(data.contracts.map((c) => [c.id, c]));

  const payments = data.payments.map((p) => {
    const contract = contractsById.get(p.contractId);
    if (!contract || p.paidAt) return p;
    const dueDate = dueDateFor(p.month, contract.dueDay);
    if (p.amount === contract.rent && p.dueDate === dueDate) return p;
    changed = true;
    return { ...p, amount: contract.rent, dueDate };
  });

  for (const contract of data.contracts) {
    if (!contract.active) continue;
    const endMonth = contract.endDate?.slice(0, 7);
    const last = endMonth && endMonth < untilMonth ? endMonth : untilMonth;
    for (let month = firstBillingMonth(contract); month <= last; month = addMonths(month, 1)) {
      if (existing.has(`${contract.id}|${month}`)) continue;
      changed = true;
      payments.push({
        id: newId(),
        contractId: contract.id,
        month,
        amount: contract.rent,
        dueDate: dueDateFor(month, contract.dueDay),
      });
    }
  }

  return changed ? payments : data.payments;
}

export function paymentStatus(payment: Payment, todayISO: string): PaymentStatus {
  if (payment.paidAt) return 'pago';
  return payment.dueDate < todayISO ? 'atrasado' : 'pendente';
}

export function activeContractForProperty(data: AppData, propertyId: string): Contract | undefined {
  return data.contracts.find((c) => c.propertyId === propertyId && c.active);
}

export interface MonthSummary {
  expected: number;
  received: number;
  overdue: number;
  expenses: number;
  overdueCount: number;
}

export function monthSummary(data: AppData, month: string, todayISO: string): MonthSummary {
  const summary: MonthSummary = { expected: 0, received: 0, overdue: 0, expenses: 0, overdueCount: 0 };
  for (const p of data.payments) {
    if (p.month !== month) continue;
    summary.expected += p.amount;
    const status = paymentStatus(p, todayISO);
    if (status === 'pago') summary.received += p.amount;
    if (status === 'atrasado') {
      summary.overdue += p.amount;
      summary.overdueCount += 1;
    }
  }
  for (const e of data.expenses) {
    if (e.date.slice(0, 7) === month) summary.expenses += e.amount;
  }
  return summary;
}

/** Todas as cobranças vencidas e não pagas, da mais antiga para a mais nova. */
export function overduePayments(data: AppData, todayISO: string): Payment[] {
  return data.payments
    .filter((p) => paymentStatus(p, todayISO) === 'atrasado')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

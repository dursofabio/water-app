import { Payment } from './balance.model';

export type PaymentDate = Date | { toDate: () => Date } | string | number | null | undefined;

/** Dashboard projection for the latest payments list. */
export interface DashboardPayment {
  id: string;
  paidAt: Date | null;
  personId: string;
  personName: string;
  personInitials: string;
  amount: number;
  note?: string | null;
}

export function toPaymentDate(value: PaymentDate): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return value.toDate();
}

export function getPaymentDate(payment: Payment): Date | null {
  return toPaymentDate(payment.date ?? payment.paidAt);
}

/** Firestore document in the 'people' collection */
export interface Person {
  id: string;
  name: string;
  initials: string;
}

/** Firestore document in the 'payments' collection */
export interface Payment {
  id?: string;
  personId: string;
  amount: number;
  date?: Date | { toDate: () => Date } | string | number | null;
  paidAt?: Date | { toDate: () => Date } | string | number | null;
  note?: string | null;
}

/** Semantic balance status */
export type BalanceStatus = 'debt-high' | 'debt-mid' | 'credit' | 'zero';

/** Computed balance for one person */
export interface PersonBalance {
  id: string;
  name: string;
  initials: string;
  loadsTotal: number;
  paymentsTotal: number;
  balance: number;
  status: BalanceStatus;
}

/**
 * Maps a numeric balance to a semantic status.
 * Positive = in credit (overpaid), negative = owes money, zero = settled.
 */
export function computeStatus(balance: number): BalanceStatus {
  if (balance < -30) return 'debt-high';
  if (balance < 0)   return 'debt-mid';
  if (balance > 0)   return 'credit';
  return 'zero';
}

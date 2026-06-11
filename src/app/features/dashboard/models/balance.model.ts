/** Firestore document in the 'people' collection */
export interface Person {
  id: string;
  name: string;
  initials: string;
}

/** Firestore document in the 'payments' collection */
export interface Payment {
  personId: string;
  amount: number;
  date?: import('@angular/fire/firestore').Timestamp;
  note?: string;
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
 * Positive = owes money, negative = in credit, zero = settled.
 */
export function computeStatus(balance: number): BalanceStatus {
  if (balance > 30) return 'debt-high';
  if (balance > 0)  return 'debt-mid';
  if (balance < 0)  return 'credit';
  return 'zero';
}

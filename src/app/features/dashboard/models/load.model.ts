export type LoadDate = Date | { toDate: () => Date } | string | number | null | undefined;

export interface LoadBreakdownDocument {
  personId: string;
  weight: number;
  amount?: number;
  cost?: number;
}

export interface LoadDocument {
  id?: string;
  date?: LoadDate;
  paidAt?: LoadDate;
  paidByPersonId?: string;
  totalAmount?: number;
  waterPrice?: number;
  energyPrice?: number;
  waterAmount?: number;
  energyAmount?: number;
  totalWeight?: number;
  breakdown?: LoadBreakdownDocument[];
  personId?: string;
  amount?: number;
}

/** One person's cost allocation captured at load creation time. */
export interface LoadBreakdownItem {
  personId: string;
  personName: string;
  weight: number;
  cost: number;
}

/** Dashboard projection for the latest water/energy loads list. */
export interface DashboardLoad {
  id: string;
  paidAt: Date | string | number;
  paidByPersonId?: string | null;
  paidByName: string;
  totalAmount: number;
  waterAmount: number;
  energyAmount: number;
  totalWeight: number;
  breakdown: LoadBreakdownItem[];
}

export function getLoadAmountForPerson(load: LoadDocument, personId: string): number {
  if (Array.isArray(load.breakdown)) {
    return load.breakdown
      .filter((item) => item.personId === personId)
      .reduce((sum, item) => sum + getBreakdownCost(item), 0);
  }

  if (load.personId === personId) return load.amount ?? 0;
  return 0;
}

export function getLoadTotalAmount(load: LoadDocument): number {
  if (typeof load.totalAmount === 'number') return load.totalAmount;
  if (Array.isArray(load.breakdown)) {
    return load.breakdown.reduce((sum, item) => sum + getBreakdownCost(item), 0);
  }

  return load.amount ?? 0;
}

export function getBreakdownCost(item: LoadBreakdownDocument): number {
  return item.cost ?? item.amount ?? 0;
}

export function toLoadDate(value: LoadDate): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return value.toDate();
}

import { Injectable, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Firestore, collection, limit, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { Observable, combineLatest, map } from 'rxjs';

import { Person } from '../models/balance.model';
import {
  DashboardLoad,
  LoadBreakdownDocument,
  LoadDocument,
  getBreakdownCost,
  getLoadTotalAmount,
  toLoadDate,
} from '../models/load.model';

export const EMPTY_DASHBOARD_LOADS: DashboardLoad[] = [];

@Injectable({ providedIn: 'root' })
export class DashboardLoadsService {
  private readonly firestore = inject(Firestore);

  private readonly people$ = this.readCollection<Person>('people', { idField: 'id' });

  private readonly loads$ = this.readCollection<LoadDocument>('loads', {
    idField: 'id',
    latestFirst: true,
    limitTo: 10,
  });

  readonly latestLoadsResource = rxResource({
    defaultValue: EMPTY_DASHBOARD_LOADS,
    stream: () => this.getLatestLoads(),
  });

  getLatestLoads(): Observable<DashboardLoad[]> {
    return combineLatest([this.people$, this.loads$]).pipe(
      map(([people, loads]) => {
        const peopleById = new Map(people.map((person) => [person.id, person]));

        return loads.map((load) => {
          const paidByPersonId = load.paidByPersonId ?? load.personId ?? null;
          const paidByName = paidByPersonId
            ? peopleById.get(paidByPersonId)?.name ?? paidByPersonId
            : 'Sconosciuto';
          const breakdown = load.breakdown ?? this.legacyBreakdown(load);
          const paidAt = toLoadDate(load.paidAt ?? load.date);

          return {
            id: load.id ?? '',
            paidAt: paidAt ?? '',
            paidByPersonId,
            paidByName,
            totalAmount: getLoadTotalAmount(load),
            waterAmount: load.waterAmount ?? load.waterPrice ?? 0,
            energyAmount: load.energyAmount ?? load.energyPrice ?? 0,
            totalWeight: load.totalWeight ?? this.sumWeights(breakdown),
            breakdown: breakdown.map((item) => ({
              personId: item.personId,
              personName: peopleById.get(item.personId)?.name ?? item.personId,
              weight: item.weight,
              cost: getBreakdownCost(item),
            })),
          } satisfies DashboardLoad;
        });
      }),
    );
  }

  private legacyBreakdown(load: LoadDocument): LoadBreakdownDocument[] {
    if (!load.personId) return [];
    return [{ personId: load.personId, weight: 1, amount: load.amount ?? 0 }];
  }

  private sumWeights(breakdown: LoadBreakdownDocument[]): number {
    return breakdown.reduce((sum, item) => sum + (item.weight ?? 0), 0);
  }

  private readCollection<T>(
    path: string,
    options?: { idField?: string; latestFirst?: boolean; limitTo?: number },
  ): Observable<T[]> {
    const ref = collection(this.firestore, path);
    const source = options?.latestFirst
      ? query(ref, orderBy('date', 'desc'), limit(options.limitTo ?? 10))
      : ref;

    return new Observable<T[]>((subscriber) =>
      onSnapshot(
        source,
        (snapshot) => {
          const documents = snapshot.docs.map((document) => {
            const data = document.data();
            return options?.idField
              ? { ...data, [options.idField]: document.id }
              : data;
          });

          subscriber.next(documents as T[]);
        },
        (error) => {
          subscriber.error(new Error(`Firestore collection "${path}" failed: ${this.formatError(error)}`));
        },
      ),
    );
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }
}

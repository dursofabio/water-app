import { Injectable, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Firestore, collection, onSnapshot } from '@angular/fire/firestore';
import { Observable, combineLatest, map } from 'rxjs';

import {
  Payment,
  Person,
  PersonBalance,
  computeStatus,
} from '../models/balance.model';
import { LoadDocument, getLoadAmountForPerson } from '../models/load.model';

export const EMPTY_BALANCES: PersonBalance[] = [];

/**
 * BalanceService — US-003
 *
 * Listens to Firestore 'people', 'loads', and 'payments' collections in real-time,
 * computes the net balance for each person, and returns an
 * Observable<PersonBalance[]> updated on every snapshot.
 *
 * Net balance = sum of load amounts − sum of payment amounts.
 * Positive = owes money, negative = in credit, zero = settled.
 */
@Injectable({ providedIn: 'root' })
export class BalanceService {
  private readonly firestore = inject(Firestore);

  private readonly people$ = this.readCollection<Person>('people', { idField: 'id' });

  private readonly loads$ = this.readCollection<LoadDocument>('loads');

  private readonly payments$ = this.readCollection<Payment>('payments');

  readonly balancesResource = rxResource({
    defaultValue: EMPTY_BALANCES,
    stream: () => this.getBalances(),
  });

  getBalances(): Observable<PersonBalance[]> {
    return combineLatest([this.people$, this.loads$, this.payments$]).pipe(
      map(([people, loads, payments]) =>
        people.map((person) => {
          const loadsTotal = loads
            .reduce((sum, load) => sum + getLoadAmountForPerson(load, person.id), 0);

          const paymentsTotal = payments
            .filter((p) => p.personId === person.id)
            .reduce((sum, p) => sum + (p.amount ?? 0), 0);

          const balance = loadsTotal - paymentsTotal;

          return {
            ...person,
            loadsTotal,
            paymentsTotal,
            balance,
            status: computeStatus(balance),
          } satisfies PersonBalance;
        }),
      ),
    );
  }

  private readCollection<T>(
    path: string,
    options?: { idField: string },
  ): Observable<T[]> {
    const ref = collection(this.firestore, path);

    return new Observable<T[]>((subscriber) =>
      onSnapshot(
        ref,
        (snapshot) => {
          const documents = snapshot.docs.map((document) => {
            const data = document.data();
            return options
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

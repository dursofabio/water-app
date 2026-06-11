import { Injectable, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Firestore, collection, limit, onSnapshot, orderBy, query } from '@angular/fire/firestore';
import { Observable, combineLatest, map } from 'rxjs';

import { Payment, Person } from '../models/balance.model';
import { DashboardPayment, getPaymentDate } from '../models/payment.model';

export const EMPTY_DASHBOARD_PAYMENTS: DashboardPayment[] = [];

@Injectable({ providedIn: 'root' })
export class DashboardPaymentsService {
  private readonly firestore = inject(Firestore);

  private readonly people$ = this.readCollection<Person>('people', { idField: 'id' });

  private readonly payments$ = this.readCollection<Payment>('payments', {
    idField: 'id',
    latestFirst: true,
    limitTo: 10,
  });

  readonly latestPaymentsResource = rxResource({
    defaultValue: EMPTY_DASHBOARD_PAYMENTS,
    stream: () => this.getLatestPayments(),
  });

  getLatestPayments(): Observable<DashboardPayment[]> {
    return combineLatest([this.people$, this.payments$]).pipe(
      map(([people, payments]) => {
        const peopleById = new Map(people.map((person) => [person.id, person]));

        return payments.map((payment) => {
          const person = peopleById.get(payment.personId);

          return {
            id: payment.id ?? '',
            paidAt: getPaymentDate(payment),
            personId: payment.personId,
            personName: person?.name ?? payment.personId,
            personInitials: person?.initials ?? this.fallbackInitials(payment.personId),
            amount: payment.amount ?? 0,
            note: payment.note ?? null,
          } satisfies DashboardPayment;
        });
      }),
    );
  }

  private fallbackInitials(personId: string): string {
    return personId.slice(0, 2).toUpperCase();
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

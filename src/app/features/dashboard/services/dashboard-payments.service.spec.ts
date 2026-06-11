import { TestBed } from '@angular/core/testing';
import { Subject, Subscription } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  collection: vi.fn((_firestore: unknown, path: string) => ({ path })),
  limit: vi.fn((size: number) => ({ type: 'limit', size })),
  onSnapshot: vi.fn(),
  orderBy: vi.fn((field: string, direction: string) => ({ type: 'orderBy', field, direction })),
  query: vi.fn((ref: { path: string }, ...constraints: unknown[]) => ({ ...ref, constraints })),
}));

const getFirestoreMocks = async () => {
  const firestore = await import('@angular/fire/firestore');
  return {
    collection: firestore.collection as ReturnType<typeof vi.fn>,
    limit: firestore.limit as ReturnType<typeof vi.fn>,
    onSnapshot: firestore.onSnapshot as ReturnType<typeof vi.fn>,
    orderBy: firestore.orderBy as ReturnType<typeof vi.fn>,
    query: firestore.query as ReturnType<typeof vi.fn>,
  };
};

type TestPerson = { id: string; name: string; initials: string };
type TestPayment = {
  id?: string;
  date?: Date;
  paidAt?: Date;
  personId: string;
  amount: number;
  note?: string | null;
};
type TestDocument = TestPerson | TestPayment;

describe('DashboardPaymentsService', () => {
  let service: import('./dashboard-payments.service').DashboardPaymentsService;
  let serviceToken: typeof import('./dashboard-payments.service').DashboardPaymentsService;
  let collectionMock: ReturnType<typeof vi.fn>;
  let limitMock: ReturnType<typeof vi.fn>;
  let onSnapshotMock: ReturnType<typeof vi.fn>;
  let orderByMock: ReturnType<typeof vi.fn>;
  let queryMock: ReturnType<typeof vi.fn>;
  let firestoreToken: unknown;

  beforeEach(async () => {
    vi.resetModules();
    const mocks = await getFirestoreMocks();
    collectionMock = mocks.collection;
    limitMock = mocks.limit;
    onSnapshotMock = mocks.onSnapshot;
    orderByMock = mocks.orderBy;
    queryMock = mocks.query;
    firestoreToken = (await import('@angular/fire/firestore')).Firestore;
    serviceToken = (await import('./dashboard-payments.service')).DashboardPaymentsService;

    collectionMock.mockClear();
    limitMock.mockClear();
    onSnapshotMock.mockReset();
    orderByMock.mockClear();
    queryMock.mockClear();

    TestBed.configureTestingModule({
      providers: [
        serviceToken,
        { provide: firestoreToken, useValue: {} },
      ],
    });
  });

  function createService(
    people$: Subject<TestPerson[]>,
    payments$: Subject<TestPayment[]>,
  ): import('./dashboard-payments.service').DashboardPaymentsService {
    onSnapshotMock.mockImplementation(
      (
        ref: { path: string },
        next: (snapshot: { docs: { id: string; data: () => unknown }[] }) => void,
        error: (error: unknown) => void,
      ) => {
        const source = {
          people: people$,
          payments: payments$,
        }[ref.path] as Subject<TestDocument[]> | undefined;

        if (!source) {
          error(new Error(`Unexpected collection: ${ref.path}`));
          return () => undefined;
        }

        const subscription: Subscription = source.subscribe({
          next: (documents: TestDocument[]) =>
            next({
              docs: documents.map((document: TestDocument, index: number) => ({
                id: 'id' in document && document.id ? String(document.id) : `${ref.path}-${index}`,
                data: () => {
                  const { id: _id, ...data } = document as TestDocument & { id?: string };
                  return data;
                },
              })),
            }),
          error,
        });

        return () => subscription.unsubscribe();
      },
    );

    return TestBed.inject(serviceToken);
  }

  it('legge people e gli ultimi 10 payments ordinati per data decrescente', () => {
    const people$ = new Subject<TestPerson[]>();
    const payments$ = new Subject<TestPayment[]>();
    createService(people$, payments$);

    expect(collectionMock).toHaveBeenNthCalledWith(1, {}, 'people');
    expect(collectionMock).toHaveBeenNthCalledWith(2, {}, 'payments');
    expect(orderByMock).toHaveBeenCalledWith('date', 'desc');
    expect(limitMock).toHaveBeenCalledWith(10);
    expect(queryMock).toHaveBeenCalledWith(
      { path: 'payments' },
      { type: 'orderBy', field: 'date', direction: 'desc' },
      { type: 'limit', size: 10 },
    );
  });

  it('risolve persona, data e nota opzionale per la dashboard', () => {
    const people$ = new Subject<TestPerson[]>();
    const payments$ = new Subject<TestPayment[]>();
    service = createService(people$, payments$);

    const results: import('../models/payment.model').DashboardPayment[][] = [];
    service.getLatestPayments().subscribe((payments) => results.push(payments));

    people$.next([
      { id: 'fernando', name: 'Fernando', initials: 'Fe' },
      { id: 'nino', name: 'Nino', initials: 'Ni' },
    ]);
    payments$.next([
      {
        id: 'payment-1',
        date: new Date('2026-06-10T10:00:00.000Z'),
        personId: 'fernando',
        amount: 100,
        note: 'Bonifico istantaneo',
      },
      {
        id: 'payment-2',
        paidAt: new Date('2026-06-08T10:00:00.000Z'),
        personId: 'nino',
        amount: 30,
      },
    ]);

    expect(results[0]).toEqual([
      {
        id: 'payment-1',
        paidAt: new Date('2026-06-10T10:00:00.000Z'),
        personId: 'fernando',
        personName: 'Fernando',
        personInitials: 'Fe',
        amount: 100,
        note: 'Bonifico istantaneo',
      },
      {
        id: 'payment-2',
        paidAt: new Date('2026-06-08T10:00:00.000Z'),
        personId: 'nino',
        personName: 'Nino',
        personInitials: 'Ni',
        amount: 30,
        note: null,
      },
    ]);
  });

  it('mantiene fallback leggibili per persone sconosciute', () => {
    const people$ = new Subject<TestPerson[]>();
    const payments$ = new Subject<TestPayment[]>();
    service = createService(people$, payments$);

    const results: import('../models/payment.model').DashboardPayment[][] = [];
    service.getLatestPayments().subscribe((payments) => results.push(payments));

    people$.next([]);
    payments$.next([{ id: 'payment-1', personId: 'ospite', amount: 12 }]);

    expect(results[0][0]).toMatchObject({
      personName: 'ospite',
      personInitials: 'OS',
      paidAt: null,
    });
  });

  it('propaga errori diagnostici con la collection payments', () => {
    const people$ = new Subject<TestPerson[]>();
    const payments$ = new Subject<TestPayment[]>();
    service = createService(people$, payments$);

    const errors: unknown[] = [];
    service.getLatestPayments().subscribe({ error: (error: unknown) => errors.push(error) });

    payments$.error(new Error('permission-denied'));

    expect(errors[0]).toEqual(
      new Error('Firestore collection "payments" failed: permission-denied'),
    );
  });
});

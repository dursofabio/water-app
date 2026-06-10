import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { Subject, Subscription } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardLoadsService } from './dashboard-loads.service';

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
type TestLoad = {
  id?: string;
  date?: Date;
  paidByPersonId?: string;
  totalAmount?: number;
  waterPrice?: number;
  energyPrice?: number;
  breakdown?: { personId: string; weight: number; amount?: number; cost?: number }[];
  personId?: string;
  amount?: number;
};
type TestDocument = TestPerson | TestLoad;

describe('DashboardLoadsService', () => {
  let service: DashboardLoadsService;
  let collectionMock: ReturnType<typeof vi.fn>;
  let limitMock: ReturnType<typeof vi.fn>;
  let onSnapshotMock: ReturnType<typeof vi.fn>;
  let orderByMock: ReturnType<typeof vi.fn>;
  let queryMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const mocks = await getFirestoreMocks();
    collectionMock = mocks.collection;
    limitMock = mocks.limit;
    onSnapshotMock = mocks.onSnapshot;
    orderByMock = mocks.orderBy;
    queryMock = mocks.query;

    collectionMock.mockClear();
    limitMock.mockClear();
    onSnapshotMock.mockReset();
    orderByMock.mockClear();
    queryMock.mockClear();

    TestBed.configureTestingModule({
      providers: [
        DashboardLoadsService,
        { provide: Firestore, useValue: {} },
      ],
    });
  });

  function createService(
    people$: Subject<TestPerson[]>,
    loads$: Subject<TestLoad[]>,
  ): DashboardLoadsService {
    onSnapshotMock.mockImplementation(
      (
        ref: { path: string },
        next: (snapshot: { docs: { id: string; data: () => unknown }[] }) => void,
        error: (error: unknown) => void,
      ) => {
        const source = {
          people: people$,
          loads: loads$,
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

    return TestBed.inject(DashboardLoadsService);
  }

  it('legge people e gli ultimi 10 loads ordinati per data decrescente', () => {
    const people$ = new Subject<TestPerson[]>();
    const loads$ = new Subject<TestLoad[]>();
    createService(people$, loads$);

    expect(collectionMock).toHaveBeenNthCalledWith(1, {}, 'people');
    expect(collectionMock).toHaveBeenNthCalledWith(2, {}, 'loads');
    expect(orderByMock).toHaveBeenCalledWith('date', 'desc');
    expect(limitMock).toHaveBeenCalledWith(10);
    expect(queryMock).toHaveBeenCalledWith(
      { path: 'loads' },
      { type: 'orderBy', field: 'date', direction: 'desc' },
      { type: 'limit', size: 10 },
    );
  });

  it('risolve pagante e breakdown in nomi persona', () => {
    const people$ = new Subject<TestPerson[]>();
    const loads$ = new Subject<TestLoad[]>();
    service = createService(people$, loads$);

    const results: import('../models/load.model').DashboardLoad[][] = [];
    service.getLatestLoads().subscribe((loads) => results.push(loads));

    people$.next([
      { id: 'fernando', name: 'Fernando', initials: 'Fe' },
      { id: 'nino', name: 'Nino', initials: 'Ni' },
      { id: 'fabio', name: 'Fabio', initials: 'Fa' },
    ]);
    loads$.next([
      {
        id: 'load-1',
        date: new Date('2026-02-10T10:00:00.000Z'),
        paidByPersonId: 'fabio',
        totalAmount: 75,
        waterPrice: 50,
        energyPrice: 25,
        breakdown: [
          { personId: 'fernando', weight: 1, amount: 25 },
          { personId: 'nino', weight: 2, amount: 50 },
        ],
      },
    ]);

    expect(results[0]).toEqual([
      {
        id: 'load-1',
        paidAt: new Date('2026-02-10T10:00:00.000Z'),
        paidByPersonId: 'fabio',
        paidByName: 'Fabio',
        totalAmount: 75,
        waterAmount: 50,
        energyAmount: 25,
        totalWeight: 3,
        breakdown: [
          { personId: 'fernando', personName: 'Fernando', weight: 1, cost: 25 },
          { personId: 'nino', personName: 'Nino', weight: 2, cost: 50 },
        ],
      },
    ]);
  });

  it('mantiene il fallback legacy personId/amount', () => {
    const people$ = new Subject<TestPerson[]>();
    const loads$ = new Subject<TestLoad[]>();
    service = createService(people$, loads$);

    const results: import('../models/load.model').DashboardLoad[][] = [];
    service.getLatestLoads().subscribe((loads) => results.push(loads));

    people$.next([{ id: 'fernando', name: 'Fernando', initials: 'Fe' }]);
    loads$.next([{ id: 'legacy-1', personId: 'fernando', amount: 45 }]);

    expect(results[0][0]).toMatchObject({
      id: 'legacy-1',
      paidByPersonId: 'fernando',
      paidByName: 'Fernando',
      totalAmount: 45,
      waterAmount: 0,
      energyAmount: 0,
      totalWeight: 1,
      breakdown: [
        { personId: 'fernando', personName: 'Fernando', weight: 1, cost: 45 },
      ],
    });
  });

  it('propaga errori diagnostici con la collection loads', () => {
    const people$ = new Subject<TestPerson[]>();
    const loads$ = new Subject<TestLoad[]>();
    service = createService(people$, loads$);

    const errors: unknown[] = [];
    service.getLatestLoads().subscribe({ error: (error: unknown) => errors.push(error) });

    loads$.error(new Error('permission-denied'));

    expect(errors[0]).toEqual(
      new Error('Firestore collection "loads" failed: permission-denied'),
    );
  });
});

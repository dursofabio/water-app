import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject, Subscription } from 'rxjs';
import { BalanceService } from './balance.service';
import { Firestore } from '@angular/fire/firestore';

/**
 * Unit tests for BalanceService — US-003
 *
 * Strategy: mock onSnapshot at the module level using vi.mock with
 * a stable factory.  Subjects are created inside each test and injected
 * via the mock's implementation so the factory itself is free of top-level
 * variable references (which would break hoisting).
 */

// vi.mock is hoisted to the top of the file by Vitest, so the factory
// must not reference any variable that is declared after this call.
vi.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  collection: vi.fn((_firestore: unknown, path: string) => ({ path })),
  onSnapshot: vi.fn(),
}));

// Lazy import after mock is registered
const getCollectionMock = async () => {
  const { collection } = await import('@angular/fire/firestore');
  return collection as ReturnType<typeof vi.fn>;
};

const getOnSnapshotMock = async () => {
  const { onSnapshot } = await import('@angular/fire/firestore');
  return onSnapshot as ReturnType<typeof vi.fn>;
};

type TestPerson = { id: string; name: string; initials: string };
type TestMovement = { personId: string; amount: number };
type TestDocument = TestPerson | TestMovement;

describe('BalanceService — getBalances() (US-003)', () => {
  let service: BalanceService;
  let collectionMock: ReturnType<typeof vi.fn>;
  let onSnapshotMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    collectionMock = await getCollectionMock();
    onSnapshotMock = await getOnSnapshotMock();
    collectionMock.mockClear();
    onSnapshotMock.mockReset();

    TestBed.configureTestingModule({
      providers: [
        BalanceService,
        { provide: Firestore, useValue: {} },
      ],
    });
  });

  function createService(
    people$: Subject<TestPerson[]>,
    loads$: Subject<TestMovement[]>,
    payments$: Subject<TestMovement[]>,
  ): BalanceService {
    onSnapshotMock.mockImplementation(
      (
        ref: { path: string },
        next: (snapshot: { docs: { id: string; data: () => unknown }[] }) => void,
        error: (error: unknown) => void,
      ) => {
        const source = {
          people: people$,
          loads: loads$,
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
                id: 'id' in document ? String(document.id) : `${ref.path}-${index}`,
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

    return TestBed.inject(BalanceService);
  }

  function seedPeople(
    people$: Subject<{ id: string; name: string; initials: string }[]>,
  ): void {
    people$.next([
      { id: 'fernando', name: 'Fernando', initials: 'Fe' },
      { id: 'nino', name: 'Nino', initials: 'Ni' },
      { id: 'daniele', name: 'Daniele', initials: 'Da' },
      { id: 'fabio', name: 'Fabio', initials: 'Fa' },
    ]);
  }

  it('legge le collection Firestore in inglese', () => {
    const people$ = new Subject<{ id: string; name: string; initials: string }[]>();
    const loads$ = new Subject<{ personId: string; amount: number }[]>();
    const payments$ = new Subject<{ personId: string; amount: number }[]>();
    createService(people$, loads$, payments$);

    expect(collectionMock).toHaveBeenNthCalledWith(1, {}, 'people');
    expect(collectionMock).toHaveBeenNthCalledWith(2, {}, 'loads');
    expect(collectionMock).toHaveBeenNthCalledWith(3, {}, 'payments');
  });

  it('emette le persone del database con balance 0 quando carichi e pagamenti sono vuoti', () => {
    const people$ = new Subject<{ id: string; name: string; initials: string }[]>();
    const loads$ = new Subject<{ personId: string; amount: number }[]>();
    const payments$ = new Subject<{ personId: string; amount: number }[]>();
    service = createService(people$, loads$, payments$);

    const results: import('../models/balance.model').PersonBalance[][] = [];
    service.getBalances().subscribe((b) => results.push(b));

    seedPeople(people$);
    loads$.next([]);
    payments$.next([]);

    expect(results).toHaveLength(1);
    expect(results[0]).toHaveLength(4);
    results[0].forEach((b) => {
      expect(b.balance).toBe(0);
      expect(b.status).toBe('zero');
    });
  });

  it('calcola correttamente il saldo netto (loads − payments)', () => {
    const people$ = new Subject<{ id: string; name: string; initials: string }[]>();
    const loads$ = new Subject<{ personId: string; amount: number }[]>();
    const payments$ = new Subject<{ personId: string; amount: number }[]>();
    service = createService(people$, loads$, payments$);

    const results: import('../models/balance.model').PersonBalance[][] = [];
    service.getBalances().subscribe((b) => results.push(b));

    seedPeople(people$);
    loads$.next([
      { personId: 'fernando', amount: 50 },
      { personId: 'fernando', amount: 20 },
      { personId: 'fabio',    amount: 100 },
    ]);
    payments$.next([{ personId: 'fernando', amount: 30 }]);

    const latest = results[results.length - 1];
    const fernando = latest.find((b) => b.id === 'fernando')!;
    const fabio    = latest.find((b) => b.id === 'fabio')!;
    const nino     = latest.find((b) => b.id === 'nino')!;

    expect(fernando.loadsTotal).toBe(70);
    expect(fernando.paymentsTotal).toBe(30);
    expect(fernando.balance).toBe(40);
    expect(fabio.balance).toBe(100);
    expect(nino.balance).toBe(0);
  });

  it('include una persona presente nel database anche se non ha movimenti', () => {
    const people$ = new Subject<{ id: string; name: string; initials: string }[]>();
    const loads$ = new Subject<{ personId: string; amount: number }[]>();
    const payments$ = new Subject<{ personId: string; amount: number }[]>();
    service = createService(people$, loads$, payments$);

    const results: import('../models/balance.model').PersonBalance[][] = [];
    service.getBalances().subscribe((b) => results.push(b));

    people$.next([
      { id: 'giulia', name: 'Giulia', initials: 'Gi' },
    ]);
    loads$.next([]);
    payments$.next([]);

    expect(results[0]).toEqual([
      {
        id: 'giulia',
        name: 'Giulia',
        initials: 'Gi',
        loadsTotal: 0,
        paymentsTotal: 0,
        balance: 0,
        status: 'zero',
      },
    ]);
  });

  it('assegna status "debt-high" quando balance > 30', () => {
    const people$ = new Subject<{ id: string; name: string; initials: string }[]>();
    const loads$ = new Subject<{ personId: string; amount: number }[]>();
    const payments$ = new Subject<{ personId: string; amount: number }[]>();
    service = createService(people$, loads$, payments$);

    const results: import('../models/balance.model').PersonBalance[][] = [];
    service.getBalances().subscribe((b) => results.push(b));

    seedPeople(people$);
    loads$.next([{ personId: 'nino', amount: 80 }]);
    payments$.next([]);

    const nino = results[results.length - 1].find((b) => b.id === 'nino')!;
    expect(nino.status).toBe('debt-high');
  });

  it('assegna status "debt-mid" quando 0 < balance <= 30', () => {
    const people$ = new Subject<{ id: string; name: string; initials: string }[]>();
    const loads$ = new Subject<{ personId: string; amount: number }[]>();
    const payments$ = new Subject<{ personId: string; amount: number }[]>();
    service = createService(people$, loads$, payments$);

    const results: import('../models/balance.model').PersonBalance[][] = [];
    service.getBalances().subscribe((b) => results.push(b));

    seedPeople(people$);
    loads$.next([{ personId: 'daniele', amount: 15 }]);
    payments$.next([]);

    const daniele = results[results.length - 1].find((b) => b.id === 'daniele')!;
    expect(daniele.status).toBe('debt-mid');
  });

  it('assegna status "credit" quando balance < 0', () => {
    const people$ = new Subject<{ id: string; name: string; initials: string }[]>();
    const loads$ = new Subject<{ personId: string; amount: number }[]>();
    const payments$ = new Subject<{ personId: string; amount: number }[]>();
    service = createService(people$, loads$, payments$);

    const results: import('../models/balance.model').PersonBalance[][] = [];
    service.getBalances().subscribe((b) => results.push(b));

    seedPeople(people$);
    loads$.next([]);
    payments$.next([{ personId: 'fabio', amount: 25 }]);

    const fabio = results[results.length - 1].find((b) => b.id === 'fabio')!;
    expect(fabio.status).toBe('credit');
    expect(fabio.balance).toBe(-25);
  });

  it('re-emette un array aggiornato quando Firestore cambia', () => {
    const people$ = new Subject<{ id: string; name: string; initials: string }[]>();
    const loads$ = new Subject<{ personId: string; amount: number }[]>();
    const payments$ = new Subject<{ personId: string; amount: number }[]>();
    service = createService(people$, loads$, payments$);

    const results: import('../models/balance.model').PersonBalance[][] = [];
    service.getBalances().subscribe((b) => results.push(b));

    seedPeople(people$);
    loads$.next([]);
    payments$.next([]);
    loads$.next([{ personId: 'fernando', amount: 60 }]);

    expect(results.length).toBeGreaterThanOrEqual(2);
    const last = results[results.length - 1];
    expect(last.find((b) => b.id === 'fernando')!.balance).toBe(60);
  });
});

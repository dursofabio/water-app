import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { BalanceService } from './balance.service';
import { Firestore } from '@angular/fire/firestore';

/**
 * Unit tests for BalanceService — US-003
 *
 * Strategy: mock collectionData at the module level using vi.mock with
 * a stable factory.  Subjects are created inside each test and injected
 * via the mock's return value so the factory itself is free of top-level
 * variable references (which would break hoisting).
 */

// vi.mock is hoisted to the top of the file by Vitest, so the factory
// must not reference any variable that is declared after this call.
vi.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  collection: vi.fn().mockReturnValue({}),
  collectionData: vi.fn(),
}));

// Lazy import after mock is registered
const getCollectionDataMock = async () => {
  const { collectionData } = await import('@angular/fire/firestore');
  return collectionData as ReturnType<typeof vi.fn>;
};

describe('BalanceService — getBalances() (US-003)', () => {
  let service: BalanceService;
  let collectionDataMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    collectionDataMock = await getCollectionDataMock();
    collectionDataMock.mockReset();

    TestBed.configureTestingModule({
      providers: [
        BalanceService,
        { provide: Firestore, useValue: {} },
      ],
    });
    service = TestBed.inject(BalanceService);
  });

  it('emette 4 PersonaBalance con saldo 0 quando le collezioni sono vuote', () => {
    const carichi$ = new Subject<{ personaId: string; importo: number }[]>();
    const pagamenti$ = new Subject<{ personaId: string; importo: number }[]>();
    collectionDataMock
      .mockReturnValueOnce(carichi$.asObservable())
      .mockReturnValueOnce(pagamenti$.asObservable());

    const results: import('../models/balance.model').PersonaBalance[][] = [];
    service.getBalances().subscribe((b) => results.push(b));

    carichi$.next([]);
    pagamenti$.next([]);

    expect(results).toHaveLength(1);
    expect(results[0]).toHaveLength(4);
    results[0].forEach((b) => {
      expect(b.saldo).toBe(0);
      expect(b.stato).toBe('zero');
    });
  });

  it('calcola correttamente il saldo netto (carichi − pagamenti)', () => {
    const carichi$ = new Subject<{ personaId: string; importo: number }[]>();
    const pagamenti$ = new Subject<{ personaId: string; importo: number }[]>();
    collectionDataMock
      .mockReturnValueOnce(carichi$.asObservable())
      .mockReturnValueOnce(pagamenti$.asObservable());

    const results: import('../models/balance.model').PersonaBalance[][] = [];
    service.getBalances().subscribe((b) => results.push(b));

    carichi$.next([
      { personaId: 'fernando', importo: 50 },
      { personaId: 'fernando', importo: 20 },
      { personaId: 'fabio',    importo: 100 },
    ]);
    pagamenti$.next([{ personaId: 'fernando', importo: 30 }]);

    const latest = results[results.length - 1];
    const fernando = latest.find((b) => b.id === 'fernando')!;
    const fabio    = latest.find((b) => b.id === 'fabio')!;
    const nino     = latest.find((b) => b.id === 'nino')!;

    expect(fernando.carichiTotale).toBe(70);
    expect(fernando.pagamentiTotale).toBe(30);
    expect(fernando.saldo).toBe(40);
    expect(fabio.saldo).toBe(100);
    expect(nino.saldo).toBe(0);
  });

  it('assegna stato "debt-high" quando saldo > 30', () => {
    const carichi$ = new Subject<{ personaId: string; importo: number }[]>();
    const pagamenti$ = new Subject<{ personaId: string; importo: number }[]>();
    collectionDataMock
      .mockReturnValueOnce(carichi$.asObservable())
      .mockReturnValueOnce(pagamenti$.asObservable());

    const results: import('../models/balance.model').PersonaBalance[][] = [];
    service.getBalances().subscribe((b) => results.push(b));

    carichi$.next([{ personaId: 'nino', importo: 80 }]);
    pagamenti$.next([]);

    const nino = results[results.length - 1].find((b) => b.id === 'nino')!;
    expect(nino.stato).toBe('debt-high');
  });

  it('assegna stato "debt-mid" quando 0 < saldo <= 30', () => {
    const carichi$ = new Subject<{ personaId: string; importo: number }[]>();
    const pagamenti$ = new Subject<{ personaId: string; importo: number }[]>();
    collectionDataMock
      .mockReturnValueOnce(carichi$.asObservable())
      .mockReturnValueOnce(pagamenti$.asObservable());

    const results: import('../models/balance.model').PersonaBalance[][] = [];
    service.getBalances().subscribe((b) => results.push(b));

    carichi$.next([{ personaId: 'daniele', importo: 15 }]);
    pagamenti$.next([]);

    const daniele = results[results.length - 1].find((b) => b.id === 'daniele')!;
    expect(daniele.stato).toBe('debt-mid');
  });

  it('assegna stato "credit" quando saldo < 0', () => {
    const carichi$ = new Subject<{ personaId: string; importo: number }[]>();
    const pagamenti$ = new Subject<{ personaId: string; importo: number }[]>();
    collectionDataMock
      .mockReturnValueOnce(carichi$.asObservable())
      .mockReturnValueOnce(pagamenti$.asObservable());

    const results: import('../models/balance.model').PersonaBalance[][] = [];
    service.getBalances().subscribe((b) => results.push(b));

    carichi$.next([]);
    pagamenti$.next([{ personaId: 'fabio', importo: 25 }]);

    const fabio = results[results.length - 1].find((b) => b.id === 'fabio')!;
    expect(fabio.stato).toBe('credit');
    expect(fabio.saldo).toBe(-25);
  });

  it('re-emette un array aggiornato quando Firestore cambia', () => {
    const carichi$ = new Subject<{ personaId: string; importo: number }[]>();
    const pagamenti$ = new Subject<{ personaId: string; importo: number }[]>();
    collectionDataMock
      .mockReturnValueOnce(carichi$.asObservable())
      .mockReturnValueOnce(pagamenti$.asObservable());

    const results: import('../models/balance.model').PersonaBalance[][] = [];
    service.getBalances().subscribe((b) => results.push(b));

    carichi$.next([]);
    pagamenti$.next([]);
    carichi$.next([{ personaId: 'fernando', importo: 60 }]);

    expect(results.length).toBeGreaterThanOrEqual(2);
    const last = results[results.length - 1];
    expect(last.find((b) => b.id === 'fernando')!.saldo).toBe(60);
  });
});

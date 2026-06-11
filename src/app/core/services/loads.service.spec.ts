import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

/**
 * Unit tests for LoadsService — US-008 / US-010
 *
 * Strategy: mock @angular/fire/firestore entirely.
 * Tests verify:
 * - calculateBreakdown: cost per person, variable weights, zero weights, error on totalWeight=0
 * - addLoad uses calculateBreakdown and writes to /loads
 * - getLoads returns Observable<LoadRecord[]> sorted by date
 * - getLoadById returns Observable<LoadRecord | null>
 * - updateLoad uses setDoc with recalculated breakdown
 * - deleteLoad calls deleteDoc on correct ref
 */

let mockAddDoc: ReturnType<typeof vi.fn>;
let mockSetDoc: ReturnType<typeof vi.fn>;
let mockDeleteDoc: ReturnType<typeof vi.fn>;
let mockOnSnapshot: ReturnType<typeof vi.fn>;
let capturedCollection: unknown;
let capturedDocument: unknown;
let capturedDocRef: unknown;

vi.mock('@angular/fire/firestore', () => {
  mockAddDoc = vi.fn().mockResolvedValue({ id: 'new-doc-id' });
  mockSetDoc = vi.fn().mockResolvedValue(undefined);
  mockDeleteDoc = vi.fn().mockResolvedValue(undefined);
  mockOnSnapshot = vi.fn().mockReturnValue(() => {});

  return {
    Firestore: class {},
    collection: vi.fn((_, path: string) => {
      capturedCollection = path;
      return { path };
    }),
    doc: vi.fn((_, path: string, id: string) => {
      capturedDocRef = { path, id };
      return { path, id };
    }),
    addDoc: vi.fn(async (col: unknown, docData: unknown) => {
      capturedDocument = docData;
      return { id: 'new-doc-id' };
    }),
    setDoc: vi.fn(async (ref: unknown, docData: unknown) => {
      capturedDocRef = ref;
      capturedDocument = docData;
    }),
    deleteDoc: vi.fn(async (ref: unknown) => {
      capturedDocRef = ref;
    }),
    onSnapshot: vi.fn().mockReturnValue(() => {}),
    query: vi.fn((col: unknown) => col),
    orderBy: vi.fn(),
    Timestamp: {
      fromDate: vi.fn((date: Date) => ({ toDate: () => date, seconds: Math.floor(date.getTime() / 1000) })),
    },
  };
});

describe('calculateBreakdown', () => {
  let calculateBreakdown: typeof import('./loads.service').calculateBreakdown;

  beforeEach(async () => {
    vi.resetModules();
    calculateBreakdown = (await import('./loads.service')).calculateBreakdown;
  });

  it('calculates cost per person as (weight / totalWeight) * (waterPrice + energyPrice)', () => {
    const result = calculateBreakdown(
      [
        { personId: 'fabio', weight: 2 },
        { personId: 'fernando', weight: 1 },
        { personId: 'nino', weight: 1 },
        { personId: 'daniele', weight: 1 },
      ],
      35,
      10,
    );

    const fabio = result.breakdown.find((b) => b.personId === 'fabio')!;
    const fernando = result.breakdown.find((b) => b.personId === 'fernando')!;
    expect(fabio.cost).toBeCloseTo(18, 5);
    expect(fernando.cost).toBeCloseTo(9, 5);
  });

  it('totalAmount equals waterPrice + energyPrice when all weights are equal', () => {
    const result = calculateBreakdown(
      [
        { personId: 'a', weight: 1 },
        { personId: 'b', weight: 1 },
      ],
      35,
      10,
    );
    expect(result.totalAmount).toBeCloseTo(45, 5);
  });

  it('totalWeight is the sum of all weights', () => {
    const result = calculateBreakdown(
      [
        { personId: 'a', weight: 2 },
        { personId: 'b', weight: 3 },
      ],
      10,
      5,
    );
    expect(result.totalWeight).toBe(5);
  });

  it('gives zero cost to persons with weight 0', () => {
    const result = calculateBreakdown(
      [
        { personId: 'fabio', weight: 3 },
        { personId: 'fernando', weight: 0 },
      ],
      35,
      10,
    );
    const fernando = result.breakdown.find((b) => b.personId === 'fernando')!;
    expect(fernando.cost).toBe(0);
  });

  it('snapshot prices: waterPrice and energyPrice combined drive total', () => {
    const result = calculateBreakdown([{ personId: 'a', weight: 1 }], 60, 15);
    expect(result.totalAmount).toBeCloseTo(75, 5);
  });

  it('throws when totalWeight is zero', () => {
    expect(() =>
      calculateBreakdown(
        [
          { personId: 'a', weight: 0 },
          { personId: 'b', weight: 0 },
        ],
        35,
        10,
      ),
    ).toThrow('somma dei pesi');
  });
});

describe('LoadsService', () => {
  let service: import('./loads.service').LoadsService;
  let serviceToken: typeof import('./loads.service').LoadsService;
  let firestoreToken: unknown;

  beforeEach(async () => {
    vi.resetModules();
    capturedCollection = undefined;
    capturedDocument = undefined;
    capturedDocRef = undefined;
    firestoreToken = (await import('@angular/fire/firestore')).Firestore;
    serviceToken = (await import('./loads.service')).LoadsService;

    TestBed.configureTestingModule({
      providers: [
        serviceToken,
        { provide: firestoreToken, useValue: {} },
      ],
    });

    service = TestBed.inject(serviceToken);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addLoad()', () => {
    it('writes the document to the /loads collection', async () => {
      await service.addLoad({
        date: new Date('2026-06-11'),
        paidByPersonId: 'fabio',
        waterPrice: 35,
        energyPrice: 10,
        weights: [
          { personId: 'fabio', weight: 1 },
          { personId: 'fernando', weight: 1 },
          { personId: 'nino', weight: 1 },
          { personId: 'daniele', weight: 1 },
        ],
      });

      expect(capturedCollection).toBe('loads');
    });

    it('saves waterPrice and energyPrice as snapshot fields', async () => {
      await service.addLoad({
        date: new Date('2026-06-11'),
        paidByPersonId: 'fabio',
        waterPrice: 35,
        energyPrice: 10,
        weights: [{ personId: 'fabio', weight: 1 }],
      });

      const docData = capturedDocument as Record<string, unknown>;
      expect(docData['waterPrice']).toBe(35);
      expect(docData['energyPrice']).toBe(10);
    });

    it('calculates cost per person as (weight / totalWeight) * (waterPrice + energyPrice)', async () => {
      await service.addLoad({
        date: new Date('2026-06-11'),
        paidByPersonId: 'fabio',
        waterPrice: 35,
        energyPrice: 10,
        weights: [
          { personId: 'fabio', weight: 2 },
          { personId: 'fernando', weight: 1 },
          { personId: 'nino', weight: 1 },
          { personId: 'daniele', weight: 1 },
        ],
      });

      const docData = capturedDocument as Record<string, unknown>;
      const breakdown = docData['breakdown'] as Array<{ personId: string; weight: number; cost: number }>;

      const fabio = breakdown.find((b) => b.personId === 'fabio')!;
      const fernando = breakdown.find((b) => b.personId === 'fernando')!;

      expect(fabio.cost).toBeCloseTo(18, 5);
      expect(fernando.cost).toBeCloseTo(9, 5);
    });

    it('saves totalWeight as the sum of all weights', async () => {
      await service.addLoad({
        date: new Date('2026-06-11'),
        paidByPersonId: 'fabio',
        waterPrice: 35,
        energyPrice: 10,
        weights: [
          { personId: 'fabio', weight: 2 },
          { personId: 'fernando', weight: 1 },
          { personId: 'nino', weight: 1 },
          { personId: 'daniele', weight: 1 },
        ],
      });

      const docData = capturedDocument as Record<string, unknown>;
      expect(docData['totalWeight']).toBe(5);
    });

    it('saves totalAmount as the sum of all person costs', async () => {
      await service.addLoad({
        date: new Date('2026-06-11'),
        paidByPersonId: 'fabio',
        waterPrice: 35,
        energyPrice: 10,
        weights: [
          { personId: 'fabio', weight: 1 },
          { personId: 'fernando', weight: 1 },
          { personId: 'nino', weight: 1 },
          { personId: 'daniele', weight: 1 },
        ],
      });

      const docData = capturedDocument as Record<string, unknown>;
      expect(docData['totalAmount']).toBeCloseTo(45, 5);
    });

    it('works when only one person has a weight > 0', async () => {
      await service.addLoad({
        date: new Date('2026-06-11'),
        paidByPersonId: 'fabio',
        waterPrice: 35,
        energyPrice: 10,
        weights: [
          { personId: 'fabio', weight: 3 },
          { personId: 'fernando', weight: 0 },
          { personId: 'nino', weight: 0 },
          { personId: 'daniele', weight: 0 },
        ],
      });

      const docData = capturedDocument as Record<string, unknown>;
      const breakdown = docData['breakdown'] as Array<{ personId: string; weight: number; cost: number }>;

      const fabio = breakdown.find((b) => b.personId === 'fabio')!;
      const fernando = breakdown.find((b) => b.personId === 'fernando')!;

      expect(fabio.cost).toBeCloseTo(45, 5);
      expect(fernando.cost).toBe(0);
    });

    it('converts Date to Firestore Timestamp', async () => {
      const date = new Date('2026-06-11T00:00:00.000Z');
      await service.addLoad({
        date,
        paidByPersonId: 'fabio',
        waterPrice: 35,
        energyPrice: 10,
        weights: [{ personId: 'fabio', weight: 1 }],
      });

      const docData = capturedDocument as Record<string, unknown>;
      expect(docData['date']).toBeTruthy();
      expect(typeof (docData['date'] as Record<string, unknown>)['seconds']).toBe('number');
    });

    it('throws an error when totalWeight is 0', async () => {
      await expect(
        service.addLoad({
          date: new Date('2026-06-11'),
          paidByPersonId: 'fabio',
          waterPrice: 35,
          energyPrice: 10,
          weights: [
            { personId: 'fabio', weight: 0 },
            { personId: 'fernando', weight: 0 },
          ],
        }),
      ).rejects.toThrow('somma dei pesi');
    });

    it('saves paidByPersonId in the document', async () => {
      await service.addLoad({
        date: new Date('2026-06-11'),
        paidByPersonId: 'nino',
        waterPrice: 35,
        energyPrice: 10,
        weights: [{ personId: 'nino', weight: 1 }],
      });

      const docData = capturedDocument as Record<string, unknown>;
      expect(docData['paidByPersonId']).toBe('nino');
    });
  });

  describe('getLoads()', () => {
    it('returns an Observable', () => {
      const obs = service.getLoads();
      expect(obs).toBeDefined();
      expect(typeof obs.subscribe).toBe('function');
    });

    it('calls onSnapshot and emits mapped LoadRecord[]', async () => {
      const firestore = await import('@angular/fire/firestore');
      const mockUnsubscribe = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(firestore.onSnapshot).mockImplementationOnce((_q: any, onNext: any) => {
        const fakeDate = { toDate: () => new Date('2026-06-01') };
        onNext({
          docs: [
            {
              id: 'load-1',
              data: () => ({
                date: fakeDate,
                paidByPersonId: 'fabio',
                waterPrice: 35,
                energyPrice: 10,
                totalAmount: 45,
                totalWeight: 4,
                breakdown: [{ personId: 'fabio', weight: 4, cost: 45 }],
              }),
            },
          ],
        });
        return mockUnsubscribe;
      });

      const results: unknown[] = [];
      const sub = service.getLoads().subscribe((records) => results.push(records));
      sub.unsubscribe();

      expect(results.length).toBeGreaterThan(0);
      const records = results[0] as Array<{ id: string; paidByPersonId: string }>;
      expect(records[0].id).toBe('load-1');
      expect(records[0].paidByPersonId).toBe('fabio');
    });
  });

  describe('getLoadById()', () => {
    it('emits null when document does not exist', async () => {
      const firestore = await import('@angular/fire/firestore');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(firestore.onSnapshot).mockImplementationOnce((_ref: any, onNext: any) => {
        onNext({ exists: () => false });
        return () => {};
      });

      const results: unknown[] = [];
      const sub = service.getLoadById('missing-id').subscribe((r) => results.push(r));
      sub.unsubscribe();

      expect(results[0]).toBeNull();
    });

    it('emits LoadRecord when document exists', async () => {
      const firestore = await import('@angular/fire/firestore');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(firestore.onSnapshot).mockImplementationOnce((_ref: any, onNext: any) => {
        const fakeDate = { toDate: () => new Date('2026-06-11') };
        onNext({
          exists: () => true,
          id: 'load-42',
          data: () => ({
            date: fakeDate,
            paidByPersonId: 'nino',
            waterPrice: 30,
            energyPrice: 8,
            totalAmount: 38,
            totalWeight: 2,
            breakdown: [],
          }),
        });
        return () => {};
      });

      const results: unknown[] = [];
      const sub = service.getLoadById('load-42').subscribe((r) => results.push(r));
      sub.unsubscribe();

      const record = results[0] as { id: string; paidByPersonId: string };
      expect(record.id).toBe('load-42');
      expect(record.paidByPersonId).toBe('nino');
    });
  });

  describe('updateLoad()', () => {
    it('calls setDoc on the correct document ref with recalculated breakdown', async () => {
      const { setDoc, doc } = await import('@angular/fire/firestore');
      const mockDocRef = { path: 'loads', id: 'load-1' };
      vi.mocked(doc).mockReturnValueOnce(mockDocRef as unknown as ReturnType<typeof doc>);
      vi.mocked(setDoc).mockResolvedValueOnce(undefined);

      await service.updateLoad('load-1', {
        date: new Date('2026-06-11'),
        paidByPersonId: 'fabio',
        waterPrice: 35,
        energyPrice: 10,
        weights: [
          { personId: 'fabio', weight: 2 },
          { personId: 'fernando', weight: 1 },
        ],
      });

      expect(setDoc).toHaveBeenCalledOnce();
      const docData = vi.mocked(setDoc).mock.calls[0][1] as Record<string, unknown>;
      expect(docData['paidByPersonId']).toBe('fabio');
      const breakdown = docData['breakdown'] as Array<{ personId: string; cost: number }>;
      const fabio = breakdown.find((b) => b.personId === 'fabio')!;
      expect(fabio.cost).toBeCloseTo(30, 5);
    });

    it('propagates Firestore errors', async () => {
      const { setDoc, doc } = await import('@angular/fire/firestore');
      vi.mocked(doc).mockReturnValueOnce({ path: 'loads', id: 'x' } as unknown as ReturnType<typeof doc>);
      vi.mocked(setDoc).mockRejectedValueOnce(new Error('Firestore update failed'));

      await expect(
        service.updateLoad('x', {
          date: new Date(),
          paidByPersonId: 'fabio',
          waterPrice: 10,
          energyPrice: 5,
          weights: [{ personId: 'fabio', weight: 1 }],
        }),
      ).rejects.toThrow('Firestore update failed');
    });
  });

  describe('deleteLoad()', () => {
    it('calls deleteDoc on the correct document ref', async () => {
      const { deleteDoc, doc } = await import('@angular/fire/firestore');
      const mockDocRef = { path: 'loads', id: 'load-99' };
      vi.mocked(doc).mockReturnValueOnce(mockDocRef as unknown as ReturnType<typeof doc>);
      vi.mocked(deleteDoc).mockResolvedValueOnce(undefined);

      await service.deleteLoad('load-99');

      expect(deleteDoc).toHaveBeenCalledWith(mockDocRef);
    });

    it('propagates Firestore errors', async () => {
      const { deleteDoc, doc } = await import('@angular/fire/firestore');
      vi.mocked(doc).mockReturnValueOnce({ path: 'loads', id: 'bad' } as unknown as ReturnType<typeof doc>);
      vi.mocked(deleteDoc).mockRejectedValueOnce(new Error('Permission denied'));

      await expect(service.deleteLoad('bad')).rejects.toThrow('Permission denied');
    });
  });
});

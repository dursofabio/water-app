import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { LoadsService } from './loads.service';

/**
 * Unit tests for LoadsService — US-008
 *
 * Strategy: mock @angular/fire/firestore entirely.
 * Tests verify:
 * - Document written to Firestore contains waterPrice, energyPrice, breakdown, totalAmount, totalWeight
 * - Cost per person: (weight / totalWeight) * (waterPrice + energyPrice)
 * - Variable weights distribute cost correctly
 * - Only one positive weight still works
 * - Throws when totalWeight is 0
 * - Timestamp is converted from Date
 */

let mockAddDoc: ReturnType<typeof vi.fn>;
let capturedCollection: unknown;
let capturedDocument: unknown;

vi.mock('@angular/fire/firestore', () => {
  mockAddDoc = vi.fn().mockResolvedValue({ id: 'new-doc-id' });

  return {
    Firestore: class {},
    collection: vi.fn((_, path: string) => {
      capturedCollection = path;
      return { path };
    }),
    addDoc: vi.fn(async (col: unknown, doc: unknown) => {
      capturedDocument = doc;
      return { id: 'new-doc-id' };
    }),
    Timestamp: {
      fromDate: vi.fn((date: Date) => ({ toDate: () => date, seconds: Math.floor(date.getTime() / 1000) })),
    },
  };
});

describe('LoadsService', () => {
  let service: LoadsService;

  beforeEach(() => {
    capturedCollection = undefined;
    capturedDocument = undefined;

    TestBed.configureTestingModule({
      providers: [
        LoadsService,
        { provide: Firestore, useValue: {} },
      ],
    });

    service = TestBed.inject(LoadsService);
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

      const doc = capturedDocument as Record<string, unknown>;
      expect(doc['waterPrice']).toBe(35);
      expect(doc['energyPrice']).toBe(10);
    });

    it('calculates cost per person as (weight / totalWeight) * (waterPrice + energyPrice)', async () => {
      // Total price per unit = 35 + 10 = 45
      // Fabio: 2/5 * 45 = 18; Fernando: 1/5 * 45 = 9; Nino: 1/5 * 45 = 9; Daniele: 1/5 * 45 = 9
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

      const doc = capturedDocument as Record<string, unknown>;
      const breakdown = doc['breakdown'] as Array<{ personId: string; weight: number; cost: number }>;

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

      const doc = capturedDocument as Record<string, unknown>;
      expect(doc['totalWeight']).toBe(5);
    });

    it('saves totalAmount as the sum of all person costs', async () => {
      // waterPrice + energyPrice = 45; all weights equal → totalAmount = 45
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

      const doc = capturedDocument as Record<string, unknown>;
      expect(doc['totalAmount']).toBeCloseTo(45, 5);
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

      const doc = capturedDocument as Record<string, unknown>;
      const breakdown = doc['breakdown'] as Array<{ personId: string; weight: number; cost: number }>;

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

      const doc = capturedDocument as Record<string, unknown>;
      // Timestamp.fromDate returns object with seconds field
      expect(doc['date']).toBeTruthy();
      expect(typeof (doc['date'] as Record<string, unknown>)['seconds']).toBe('number');
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

      const doc = capturedDocument as Record<string, unknown>;
      expect(doc['paidByPersonId']).toBe('nino');
    });
  });
});

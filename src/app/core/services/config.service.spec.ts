import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from './config.service';
import { Firestore } from '@angular/fire/firestore';
import { DEFAULT_PRICES } from '../models/config.model';

/**
 * Unit tests for ConfigService — US-008 / US-013
 *
 * Strategy: mock @angular/fire/firestore entirely.
 * Tests verify:
 * - Returns correct prices when /config/prices exists
 * - Returns DEFAULT_PRICES when document does not exist
 * - Propagates error when onSnapshot fails
 * - rxResource defaultValue is DEFAULT_PRICES
 * - updatePrices() calls setDoc with correct args and merge: true
 * - updatePrices() re-throws when setDoc rejects
 */

type SnapshotCallback = (snapshot: { exists: () => boolean; data: () => Record<string, unknown> }) => void;
type ErrorCallback = (error: Error) => void;

let capturedSnapshotCallback: SnapshotCallback | null = null;
let capturedErrorCallback: ErrorCallback | null = null;
let mockUnsubscribe: ReturnType<typeof vi.fn>;
const mockSetDoc = vi.fn();

vi.mock('@angular/fire/firestore', () => {
  return {
    Firestore: class {},
    doc: vi.fn((_firestore: unknown, ...segments: string[]) => ({ path: segments.join('/') })),
    onSnapshot: vi.fn(
      (
        _docRef: unknown,
        successCallback: SnapshotCallback,
        errorCallback: ErrorCallback,
      ) => {
        capturedSnapshotCallback = successCallback;
        capturedErrorCallback = errorCallback;
        if (!mockUnsubscribe) {
          mockUnsubscribe = vi.fn();
        }
        return mockUnsubscribe;
      },
    ),
    setDoc: (...args: unknown[]) => (mockSetDoc as (...a: unknown[]) => unknown)(...args),
  };
});

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(() => {
    capturedSnapshotCallback = null;
    capturedErrorCallback = null;

    TestBed.configureTestingModule({
      providers: [
        ConfigService,
        { provide: Firestore, useValue: {} },
      ],
    });

    service = TestBed.inject(ConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPrices()', () => {
    it('emits parsed prices when /config/prices document exists', () => {
      const emissions: unknown[] = [];
      service.getPrices().subscribe((prices) => emissions.push(prices));

      capturedSnapshotCallback!({
        exists: () => true,
        data: () => ({ waterPrice: 40, energyPrice: 15 }),
      });

      expect(emissions).toHaveLength(1);
      expect(emissions[0]).toEqual({ waterPrice: 40, energyPrice: 15 });
    });

    it('emits DEFAULT_PRICES when /config/prices document does not exist', () => {
      const emissions: unknown[] = [];
      service.getPrices().subscribe((prices) => emissions.push(prices));

      capturedSnapshotCallback!({
        exists: () => false,
        data: () => ({}),
      });

      expect(emissions).toHaveLength(1);
      expect(emissions[0]).toEqual(DEFAULT_PRICES);
    });

    it('falls back to DEFAULT_PRICES for missing individual fields', () => {
      const emissions: unknown[] = [];
      service.getPrices().subscribe((prices) => emissions.push(prices));

      capturedSnapshotCallback!({
        exists: () => true,
        data: () => ({ waterPrice: 50 }), // energyPrice missing
      });

      expect(emissions).toHaveLength(1);
      expect(emissions[0]).toEqual({ waterPrice: 50, energyPrice: DEFAULT_PRICES.energyPrice });
    });

    it('falls back to DEFAULT_PRICES when price fields are not numbers', () => {
      const emissions: unknown[] = [];
      service.getPrices().subscribe((prices) => emissions.push(prices));

      capturedSnapshotCallback!({
        exists: () => true,
        data: () => ({ waterPrice: 'invalid', energyPrice: null }),
      });

      expect(emissions).toHaveLength(1);
      expect(emissions[0]).toEqual(DEFAULT_PRICES);
    });

    it('propagates an error when onSnapshot fails', () => {
      const errors: unknown[] = [];
      service.getPrices().subscribe({ error: (err) => errors.push(err) });

      capturedErrorCallback!(new Error('Firestore unavailable'));

      expect(errors).toHaveLength(1);
      expect((errors[0] as Error).message).toContain('/config/prices failed');
      expect((errors[0] as Error).message).toContain('Firestore unavailable');
    });

    it('emits multiple values as the document changes', () => {
      const emissions: unknown[] = [];
      service.getPrices().subscribe((prices) => emissions.push(prices));

      capturedSnapshotCallback!({
        exists: () => true,
        data: () => ({ waterPrice: 35, energyPrice: 10 }),
      });

      capturedSnapshotCallback!({
        exists: () => true,
        data: () => ({ waterPrice: 45, energyPrice: 12 }),
      });

      expect(emissions).toHaveLength(2);
      expect(emissions[1]).toEqual({ waterPrice: 45, energyPrice: 12 });
    });

    it('calls unsubscribe when the Observable is unsubscribed', () => {
      const subscription = service.getPrices().subscribe(() => undefined);
      subscription.unsubscribe();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('pricesResource', () => {
    it('has DEFAULT_PRICES as defaultValue', () => {
      expect(service.pricesResource.value()).toEqual(DEFAULT_PRICES);
    });
  });

  describe('DEFAULT_PRICES', () => {
    it('has waterPrice 35 and energyPrice 10', () => {
      expect(DEFAULT_PRICES).toEqual({ waterPrice: 35, energyPrice: 10 });
    });
  });

  describe('updatePrices()', () => {
    beforeEach(() => {
      mockSetDoc.mockReset();
    });

    it('calls setDoc with doc(firestore, config, prices) and the payload', async () => {
      mockSetDoc.mockResolvedValue(undefined);
      const prices = { waterPrice: 28, energyPrice: 12 };

      await service.updatePrices(prices);

      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      const [docRef, payload] = mockSetDoc.mock.calls[0];
      expect(docRef).toEqual({ path: 'config/prices' });
      expect(payload).toEqual(prices);
    });

    it('calls setDoc with merge: true', async () => {
      mockSetDoc.mockResolvedValue(undefined);

      await service.updatePrices({ waterPrice: 28, energyPrice: 12 });

      const [, , options] = mockSetDoc.mock.calls[0];
      expect(options).toEqual({ merge: true });
    });

    it('re-throws when setDoc rejects', async () => {
      const firestoreError = new Error('permission-denied');
      mockSetDoc.mockRejectedValue(firestoreError);

      await expect(service.updatePrices({ waterPrice: 28, energyPrice: 12 })).rejects.toThrow('permission-denied');
    });
  });
});

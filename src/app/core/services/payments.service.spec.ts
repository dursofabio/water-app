import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { PaymentsService } from './payments.service';

/**
 * Unit tests for PaymentsService — US-011
 *
 * Strategy: mock @angular/fire/firestore entirely.
 * Tests verify:
 * - Document written to Firestore contains personId, amount, date as Timestamp
 * - note field is included only when provided
 * - note is omitted from the document when not provided
 * - amount ≤ 0 throws an error
 * - Timestamp is converted from Date
 */

let capturedCollection: unknown;
let capturedDocument: unknown;

vi.mock('@angular/fire/firestore', () => {
  return {
    Firestore: class {},
    collection: vi.fn((_, path: string) => {
      capturedCollection = path;
      return { path };
    }),
    addDoc: vi.fn(async (col: unknown, doc: unknown) => {
      capturedDocument = doc;
      return { id: 'new-payment-id' };
    }),
    Timestamp: {
      fromDate: vi.fn((date: Date) => ({
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
      })),
    },
  };
});

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(() => {
    capturedCollection = undefined;
    capturedDocument = undefined;

    TestBed.configureTestingModule({
      providers: [
        PaymentsService,
        { provide: Firestore, useValue: {} },
      ],
    });

    service = TestBed.inject(PaymentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addPayment()', () => {
    it('writes the document to the /payments collection', async () => {
      await service.addPayment({
        personId: 'fernando',
        amount: 50,
        date: new Date('2026-06-11'),
      });

      expect(capturedCollection).toBe('payments');
    });

    it('saves personId in the document', async () => {
      await service.addPayment({
        personId: 'fernando',
        amount: 50,
        date: new Date('2026-06-11'),
      });

      const doc = capturedDocument as Record<string, unknown>;
      expect(doc['personId']).toBe('fernando');
    });

    it('saves amount in the document', async () => {
      await service.addPayment({
        personId: 'nino',
        amount: 75,
        date: new Date('2026-06-11'),
      });

      const doc = capturedDocument as Record<string, unknown>;
      expect(doc['amount']).toBe(75);
    });

    it('converts Date to Firestore Timestamp', async () => {
      const date = new Date('2026-06-11T00:00:00.000Z');
      await service.addPayment({
        personId: 'fabio',
        amount: 100,
        date,
      });

      const doc = capturedDocument as Record<string, unknown>;
      expect(doc['date']).toBeTruthy();
      expect(typeof (doc['date'] as Record<string, unknown>)['seconds']).toBe('number');
    });

    it('includes note in the document when provided', async () => {
      await service.addPayment({
        personId: 'daniele',
        amount: 30,
        date: new Date('2026-06-11'),
        note: 'Pagamento acconto giugno',
      });

      const doc = capturedDocument as Record<string, unknown>;
      expect(doc['note']).toBe('Pagamento acconto giugno');
    });

    it('omits note from the document when not provided', async () => {
      await service.addPayment({
        personId: 'fernando',
        amount: 50,
        date: new Date('2026-06-11'),
      });

      const doc = capturedDocument as Record<string, unknown>;
      expect('note' in doc).toBe(false);
    });

    it('omits note from the document when empty string provided', async () => {
      await service.addPayment({
        personId: 'fernando',
        amount: 50,
        date: new Date('2026-06-11'),
        note: '',
      });

      const doc = capturedDocument as Record<string, unknown>;
      expect('note' in doc).toBe(false);
    });

    it('throws an error when amount is 0', async () => {
      await expect(
        service.addPayment({
          personId: 'fabio',
          amount: 0,
          date: new Date('2026-06-11'),
        }),
      ).rejects.toThrow('importo');
    });

    it('throws an error when amount is negative', async () => {
      await expect(
        service.addPayment({
          personId: 'fabio',
          amount: -10,
          date: new Date('2026-06-11'),
        }),
      ).rejects.toThrow('importo');
    });

    it('resolves successfully for a valid payment with all fields', async () => {
      await expect(
        service.addPayment({
          personId: 'nino',
          amount: 45.5,
          date: new Date('2026-06-11'),
          note: 'Bonifico',
        }),
      ).resolves.toBeUndefined();
    });
  });
});

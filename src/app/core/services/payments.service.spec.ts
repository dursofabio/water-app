import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';

/**
 * Unit tests for PaymentsService — US-011 / US-012
 *
 * Strategy: mock @angular/fire/firestore entirely.
 * Tests verify:
 * - Document written to Firestore contains personId, amount, date as Timestamp
 * - note field is included only when provided
 * - note is omitted from the document when not provided
 * - amount ≤ 0 throws an error
 * - Timestamp is converted from Date
 * - getPayments() calls onSnapshot on a query ordered by date desc and maps docs to PaymentRecord[]
 * - getPaymentById() emits null for non-existent documents, PaymentRecord for existing ones
 * - updatePayment() calls setDoc with Timestamp; throws when amount ≤ 0
 * - deletePayment() calls deleteDoc on the correct ref
 */

let capturedCollection: unknown;
let capturedDocument: unknown;
let capturedDocRef: unknown;

vi.mock('@angular/fire/firestore', () => {
  return {
    Firestore: class {},
    collection: vi.fn((_, path: string) => {
      capturedCollection = path;
      return { path };
    }),
    doc: vi.fn((_fs: unknown, path: string, id: string) => {
      capturedDocRef = { path, id };
      return { path, id };
    }),
    addDoc: vi.fn(async (col: unknown, doc: unknown) => {
      capturedDocument = doc;
      return { id: 'new-payment-id' };
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
      fromDate: vi.fn((date: Date) => ({
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
      })),
    },
  };
});

describe('PaymentsService', () => {
  let service: import('./payments.service').PaymentsService;
  let serviceToken: typeof import('./payments.service').PaymentsService;
  let firestoreToken: unknown;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    capturedCollection = undefined;
    capturedDocument = undefined;
    capturedDocRef = undefined;
    firestoreToken = (await import('@angular/fire/firestore')).Firestore;
    serviceToken = (await import('./payments.service')).PaymentsService;

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

  describe('getPayments()', () => {
    it('returns an Observable', () => {
      const obs = service.getPayments();
      expect(obs).toBeDefined();
      expect(typeof obs.subscribe).toBe('function');
    });

    it('calls onSnapshot and emits mapped PaymentRecord[]', async () => {
      const firestore = await import('@angular/fire/firestore');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(firestore.onSnapshot).mockImplementationOnce((_q: any, onNext: any) => {
        const fakeDate = { toDate: () => new Date('2026-06-01') };
        onNext({
          docs: [
            {
              id: 'pay-1',
              data: () => ({
                personId: 'fernando',
                amount: 50,
                date: fakeDate,
              }),
            },
          ],
        });
        return () => {};
      });

      const results: unknown[] = [];
      const sub = service.getPayments().subscribe((records) => results.push(records));
      sub.unsubscribe();

      expect(results.length).toBeGreaterThan(0);
      const records = results[0] as Array<{ id: string; personId: string; amount: number }>;
      expect(records[0].id).toBe('pay-1');
      expect(records[0].personId).toBe('fernando');
      expect(records[0].amount).toBe(50);
    });

    it('maps note field when present in the document', async () => {
      const firestore = await import('@angular/fire/firestore');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(firestore.onSnapshot).mockImplementationOnce((_q: any, onNext: any) => {
        onNext({
          docs: [
            {
              id: 'pay-2',
              data: () => ({
                personId: 'nino',
                amount: 30,
                date: { toDate: () => new Date('2026-05-15') },
                note: 'Acconto maggio',
              }),
            },
          ],
        });
        return () => {};
      });

      const results: unknown[] = [];
      service.getPayments().subscribe((records) => results.push(records)).unsubscribe();

      const records = results[0] as Array<{ note?: string }>;
      expect(records[0].note).toBe('Acconto maggio');
    });

    it('omits note field when absent in the document', async () => {
      const firestore = await import('@angular/fire/firestore');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(firestore.onSnapshot).mockImplementationOnce((_q: any, onNext: any) => {
        onNext({
          docs: [
            {
              id: 'pay-3',
              data: () => ({
                personId: 'daniele',
                amount: 20,
                date: { toDate: () => new Date('2026-04-10') },
              }),
            },
          ],
        });
        return () => {};
      });

      const results: unknown[] = [];
      service.getPayments().subscribe((records) => results.push(records)).unsubscribe();

      const records = results[0] as Array<Record<string, unknown>>;
      expect('note' in records[0]).toBe(false);
    });

    it('uses query ordered by date descending', async () => {
      const firestore = await import('@angular/fire/firestore');
      service.getPayments().subscribe().unsubscribe();

      expect(firestore.orderBy).toHaveBeenCalledWith('date', 'desc');
      expect(firestore.query).toHaveBeenCalled();
    });

    it('propagates Firestore errors to the observable', async () => {
      const firestore = await import('@angular/fire/firestore');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(firestore.onSnapshot).mockImplementationOnce((_q: any, _onNext: any, onError: any) => {
        onError(new Error('Firestore read failed'));
        return () => {};
      });

      await expect(
        new Promise<void>((_resolve, reject) => {
          service.getPayments().subscribe({ error: reject });
        }),
      ).rejects.toThrow('Firestore read failed');
    });
  });

  describe('getPaymentById()', () => {
    it('emits null when document does not exist', async () => {
      const firestore = await import('@angular/fire/firestore');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(firestore.onSnapshot).mockImplementationOnce((_ref: any, onNext: any) => {
        onNext({ exists: () => false });
        return () => {};
      });

      const results: unknown[] = [];
      service.getPaymentById('missing-id').subscribe((r) => results.push(r)).unsubscribe();

      expect(results[0]).toBeNull();
    });

    it('emits PaymentRecord when document exists', async () => {
      const firestore = await import('@angular/fire/firestore');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(firestore.onSnapshot).mockImplementationOnce((_ref: any, onNext: any) => {
        onNext({
          exists: () => true,
          id: 'pay-42',
          data: () => ({
            personId: 'fabio',
            amount: 120,
            date: { toDate: () => new Date('2026-06-11') },
          }),
        });
        return () => {};
      });

      const results: unknown[] = [];
      service.getPaymentById('pay-42').subscribe((r) => results.push(r)).unsubscribe();

      const record = results[0] as { id: string; personId: string; amount: number };
      expect(record.id).toBe('pay-42');
      expect(record.personId).toBe('fabio');
      expect(record.amount).toBe(120);
    });

    it('includes note in emitted record when present in document', async () => {
      const firestore = await import('@angular/fire/firestore');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(firestore.onSnapshot).mockImplementationOnce((_ref: any, onNext: any) => {
        onNext({
          exists: () => true,
          id: 'pay-10',
          data: () => ({
            personId: 'nino',
            amount: 60,
            date: { toDate: () => new Date('2026-06-01') },
            note: 'Saldo giugno',
          }),
        });
        return () => {};
      });

      const results: unknown[] = [];
      service.getPaymentById('pay-10').subscribe((r) => results.push(r)).unsubscribe();

      const record = results[0] as { note?: string };
      expect(record.note).toBe('Saldo giugno');
    });

    it('propagates Firestore errors to the observable', async () => {
      const firestore = await import('@angular/fire/firestore');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(firestore.onSnapshot).mockImplementationOnce((_ref: any, _onNext: any, onError: any) => {
        onError(new Error('Permission denied'));
        return () => {};
      });

      await expect(
        new Promise<void>((_resolve, reject) => {
          service.getPaymentById('some-id').subscribe({ error: reject });
        }),
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('updatePayment()', () => {
    it('calls setDoc on the correct document ref', async () => {
      const { setDoc, doc } = await import('@angular/fire/firestore');
      const mockDocRef = { path: 'payments', id: 'pay-1' };
      vi.mocked(doc).mockReturnValueOnce(mockDocRef as unknown as ReturnType<typeof doc>);
      vi.mocked(setDoc).mockResolvedValueOnce(undefined);

      await service.updatePayment('pay-1', {
        personId: 'fernando',
        amount: 75,
        date: new Date('2026-06-11'),
      });

      expect(setDoc).toHaveBeenCalledOnce();
      expect(vi.mocked(setDoc).mock.calls[0][0]).toBe(mockDocRef);
    });

    it('saves personId and amount in the updated document', async () => {
      const { setDoc, doc } = await import('@angular/fire/firestore');
      vi.mocked(doc).mockReturnValueOnce({ path: 'payments', id: 'pay-1' } as unknown as ReturnType<typeof doc>);
      vi.mocked(setDoc).mockResolvedValueOnce(undefined);

      await service.updatePayment('pay-1', {
        personId: 'nino',
        amount: 90,
        date: new Date('2026-06-11'),
      });

      const docData = vi.mocked(setDoc).mock.calls[0][1] as Record<string, unknown>;
      expect(docData['personId']).toBe('nino');
      expect(docData['amount']).toBe(90);
    });

    it('converts Date to Firestore Timestamp when updating', async () => {
      const { setDoc, doc } = await import('@angular/fire/firestore');
      vi.mocked(doc).mockReturnValueOnce({ path: 'payments', id: 'pay-1' } as unknown as ReturnType<typeof doc>);
      vi.mocked(setDoc).mockResolvedValueOnce(undefined);

      const date = new Date('2026-06-11T00:00:00.000Z');
      await service.updatePayment('pay-1', {
        personId: 'fabio',
        amount: 100,
        date,
      });

      const docData = vi.mocked(setDoc).mock.calls[0][1] as Record<string, unknown>;
      expect(docData['date']).toBeTruthy();
      expect(typeof (docData['date'] as Record<string, unknown>)['seconds']).toBe('number');
    });

    it('includes note in the updated document when provided', async () => {
      const { setDoc, doc } = await import('@angular/fire/firestore');
      vi.mocked(doc).mockReturnValueOnce({ path: 'payments', id: 'pay-5' } as unknown as ReturnType<typeof doc>);
      vi.mocked(setDoc).mockResolvedValueOnce(undefined);

      await service.updatePayment('pay-5', {
        personId: 'daniele',
        amount: 40,
        date: new Date('2026-06-11'),
        note: 'Rettifica importo',
      });

      const docData = vi.mocked(setDoc).mock.calls[0][1] as Record<string, unknown>;
      expect(docData['note']).toBe('Rettifica importo');
    });

    it('omits note from the updated document when not provided', async () => {
      const { setDoc, doc } = await import('@angular/fire/firestore');
      vi.mocked(doc).mockReturnValueOnce({ path: 'payments', id: 'pay-6' } as unknown as ReturnType<typeof doc>);
      vi.mocked(setDoc).mockResolvedValueOnce(undefined);

      await service.updatePayment('pay-6', {
        personId: 'fernando',
        amount: 55,
        date: new Date('2026-06-11'),
      });

      const docData = vi.mocked(setDoc).mock.calls[0][1] as Record<string, unknown>;
      expect('note' in docData).toBe(false);
    });

    it('throws when amount is 0', async () => {
      await expect(
        service.updatePayment('pay-7', {
          personId: 'fabio',
          amount: 0,
          date: new Date('2026-06-11'),
        }),
      ).rejects.toThrow('importo');
    });

    it('throws when amount is negative', async () => {
      await expect(
        service.updatePayment('pay-8', {
          personId: 'fabio',
          amount: -5,
          date: new Date('2026-06-11'),
        }),
      ).rejects.toThrow('importo');
    });

    it('propagates Firestore errors', async () => {
      const { setDoc, doc } = await import('@angular/fire/firestore');
      vi.mocked(doc).mockReturnValueOnce({ path: 'payments', id: 'x' } as unknown as ReturnType<typeof doc>);
      vi.mocked(setDoc).mockRejectedValueOnce(new Error('Firestore update failed'));

      await expect(
        service.updatePayment('x', {
          personId: 'fabio',
          amount: 10,
          date: new Date(),
        }),
      ).rejects.toThrow('Firestore update failed');
    });
  });

  describe('deletePayment()', () => {
    it('calls deleteDoc on the correct document ref', async () => {
      const { deleteDoc, doc } = await import('@angular/fire/firestore');
      const mockDocRef = { path: 'payments', id: 'pay-99' };
      vi.mocked(doc).mockReturnValueOnce(mockDocRef as unknown as ReturnType<typeof doc>);
      vi.mocked(deleteDoc).mockResolvedValueOnce(undefined);

      await service.deletePayment('pay-99');

      expect(deleteDoc).toHaveBeenCalledWith(mockDocRef);
    });

    it('propagates Firestore errors', async () => {
      const { deleteDoc, doc } = await import('@angular/fire/firestore');
      vi.mocked(doc).mockReturnValueOnce({ path: 'payments', id: 'bad' } as unknown as ReturnType<typeof doc>);
      vi.mocked(deleteDoc).mockRejectedValueOnce(new Error('Permission denied'));

      await expect(service.deletePayment('bad')).rejects.toThrow('Permission denied');
    });
  });
});

import { describe, expect, it } from 'vitest';
import { excelSerialToDate, normalizePersonId, parseHistoricalWorkbook, parseLoads } from './import-excel-parser.mjs';
import { runImport } from './import-excel.mjs';

const HEADER = ['Data', 'Pagato Da', 'Fabio', 'Fernando', 'Daniele', 'Nino', 'SommaQuote', 'Fabio', 'Fernando', 'Daniele', 'Nino', null, null, null, null, null, null, null, null, 45, 10, 55];

describe('parser Excel storico acqua', () => {
  it('converte seriali Excel con la formula richiesta', () => {
    expect(excelSerialToDate(25569).toISOString()).toBe('1970-01-01T00:00:00.000Z');
    expect(excelSerialToDate(45792).toISOString()).toBe('2025-05-15T00:00:00.000Z');
  });

  it('normalizza persone e note nel pagatore', () => {
    expect(normalizePersonId('Fabio (15 fernando)')).toBe('fabio');
    expect(normalizePersonId('Férnando')).toBe('fernando');
    expect(normalizePersonId('sconosciuto')).toBeNull();
  });

  it('mappa carichi con prezzi snapshot, pesi e costi del foglio', () => {
    const { loads } = parseLoads([HEADER, [45792, 'Fabio', 1, 1, 0, 0, 2, 27.5, 27.5, 0, 0]]);
    expect(loads[0]).toMatchObject({
      id: 'excel-load-2',
      paidByPersonId: 'fabio',
      waterPrice: 45,
      energyPrice: 10,
      totalAmount: 55,
      totalWeight: 2,
      breakdown: [
        { personId: 'fabio', weight: 1, cost: 27.5 },
        { personId: 'fernando', weight: 1, cost: 27.5 },
      ],
    });
  });

  it('ricalcola costi mancanti e usa il pagatore precedente per celle vuote', () => {
    const { loads, skippedRows } = parseLoads([
      HEADER,
      [45792, 'Fabio', 1, 1, 0, 0, 2, null, 27.5, 0, 0],
      [45812, null, 2, 1, 1, 0, 4, 27.5, 13.75, 13.75, 0],
    ]);
    expect(skippedRows).toEqual([]);
    expect(loads[0].breakdown).toContainEqual({ personId: 'fabio', weight: 1, cost: 27.5 });
    expect(loads[1].paidByPersonId).toBe('fabio');
  });

  it('estrae anticipi e rendiconta righe scartate', () => {
    const parsed = parseHistoricalWorkbook([
      HEADER,
      ['Totale', 1650, 42.25, 18, 33, 12, 105.25],
      ['di Acqua', 1350, null, null, null, null, null, 'Anticipi'],
      [null, null, null, null, null, null, null, 'Fabio', 'Fernando'],
      [null, null, null, null, null, null, null, 420, 200],
    ]);
    expect(parsed.payments).toEqual([
      expect.objectContaining({ id: 'excel-payment-fabio-5', personId: 'fabio', amount: 420 }),
      expect.objectContaining({ id: 'excel-payment-fernando-5', personId: 'fernando', amount: 200 }),
    ]);
    expect(parsed.skippedRows).toEqual([
      { rowNumber: 2, reason: 'riga senza data seriale o peso totale valido' },
      { rowNumber: 3, reason: 'riga senza data seriale o peso totale valido' },
    ]);
  });
});

describe('import Firestore idempotente', () => {
  it('scrive con ID deterministici e blocca la seconda esecuzione senza force', async () => {
    const db = new FakeFirestore();
    const parsed = parseHistoricalWorkbook([
      HEADER,
      [45792, 'Fabio', 1, 1, 0, 0, 2, 27.5, 27.5, 0, 0],
      ['di Acqua', 1350, null, null, null, null, null, 'Anticipi'],
      [null, null, null, null, null, null, null, 'Fabio'],
      [null, null, null, null, null, null, null, 420],
    ]);

    const summary = await runImport(db, parsed);
    expect(summary.loadsImported).toBe(1);
    expect(db.data.loads['excel-load-2']).toMatchObject({ source: 'excel-2025', sourceRow: 2 });
    expect(db.data.payments['excel-payment-fabio-5']).toMatchObject({ source: 'excel-2025', sourceRow: 5 });
    await expect(runImport(db, parsed)).rejects.toThrow('Import storico gia presente');
    await expect(runImport(db, parsed, { force: true })).resolves.toMatchObject({ force: true });
  });
});

class FakeFirestore {
  constructor() {
    this.data = { people: {}, loads: {}, payments: {} };
  }
  collection(name) {
    return { doc: (id) => ({ db: this, collectionName: name, id, path: `${name}/${id}`, get: async () => ({ exists: id in this.data[name] }) }) };
  }
  batch() {
    return {
      operations: [],
      set(ref, value, options = {}) { this.operations.push({ ref, value, options }); },
      commit: async () => {
        for (const operation of this.batch().operations) void operation;
      },
    };
  }
}

FakeFirestore.prototype.batch = function batch() {
  const operations = [];
  return {
    set(ref, value, options = {}) { operations.push({ ref, value, options }); },
    commit: async () => {
      for (const operation of operations) {
        const existing = this.data[operation.ref.collectionName][operation.ref.id] ?? {};
        this.data[operation.ref.collectionName][operation.ref.id] = operation.options.merge
          ? { ...existing, ...operation.value }
          : operation.value;
      }
    },
  };
};

import { describe, expect, it } from 'vitest';
import {
  excelSerialToDate,
  normalizePersonId,
  parseExcelValidationTotals,
  parseHistoricalWorkbook,
  parseLoads,
} from './import-excel-parser.mjs';
import { runImport } from './import-excel.mjs';
import {
  aggregateAppBalances,
  compareBalanceTotals,
  formatValidationReport,
  readImportedAppTotals,
} from './validate-excel-balances.mjs';

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

  it('estrae totali di validazione e voci esplicative dal foglio', () => {
    const totals = parseExcelValidationTotals([
      HEADER,
      ['Totale', 1650, 2, 1, 0, 0, 3, 55, 27.5, 0, 0],
      ['di Acqua', 1350, null, null, null, null, null, 'Anticipi'],
      [null, null, null, null, null, null, null, 'Fabio', 'Fernando'],
      [null, null, null, null, null, null, null, 100, 50],
      ['Fondo Cassa', null, null, null, null, null, null, 10, 5],
      ['In energia', null, null, null, null, null, null, 2, 0],
    ]);

    expect(totals.find((person) => person.personId === 'fabio')).toMatchObject({
      excelLoadsTotal: 55,
      excelPaymentsTotal: 100,
      excelBalance: 45,
      excelFinalBalance: 57,
      explanations: [
        { label: 'Fondo Cassa', amount: 10 },
        { label: 'In energia', amount: 2 },
      ],
    });
    expect(totals.find((person) => person.personId === 'fernando')).toMatchObject({
      excelLoadsTotal: 27.5,
      excelPaymentsTotal: 50,
      excelBalance: 22.5,
      excelFinalBalance: 27.5,
      explanations: [{ label: 'Fondo Cassa', amount: 5 }],
    });
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

describe('validazione saldi Excel importati', () => {
  it('aggrega i saldi app usando breakdown cost o amount e la semantica payments - loads', () => {
    const balances = aggregateAppBalances({
      people: [
        { id: 'fabio', name: 'Fabio', initials: 'Fa' },
        { id: 'fernando', name: 'Fernando', initials: 'Fe' },
      ],
      loads: [
        {
          source: 'excel-2025',
          breakdown: [
            { personId: 'fabio', weight: 1, cost: 20 },
            { personId: 'fernando', weight: 1, amount: 10 },
          ],
        },
        { source: 'excel-2025', personId: 'fabio', amount: 5 },
      ],
      payments: [
        { source: 'excel-2025', personId: 'fabio', amount: 40 },
        { source: 'excel-2025', personId: 'fernando', amount: 4 },
      ],
    });

    expect(balances).toEqual([
      expect.objectContaining({ personId: 'fabio', appLoadsTotal: 25, appPaymentsTotal: 40, appBalance: 15 }),
      expect.objectContaining({ personId: 'fernando', appLoadsTotal: 10, appPaymentsTotal: 4, appBalance: -6 }),
    ]);
  });

  it('classifica OK, EXPLAINED e FAIL con tolleranza centesimale', () => {
    const appTotals = [
      { personId: 'fabio', personName: 'Fabio', appLoadsTotal: 55, appPaymentsTotal: 100, appBalance: 45 },
      { personId: 'fernando', personName: 'Fernando', appLoadsTotal: 27.5, appPaymentsTotal: 50, appBalance: 22.5 },
      { personId: 'nino', personName: 'Nino', appLoadsTotal: 10, appPaymentsTotal: 5, appBalance: -5 },
      { personId: 'daniele', personName: 'Daniele', appLoadsTotal: 20, appPaymentsTotal: 15, appBalance: -5 },
    ];
    const excelTotals = [
      { personId: 'fabio', personName: 'Fabio', excelLoadsTotal: 55, excelPaymentsTotal: 100, excelBalance: 45, excelFinalBalance: null, explanations: [] },
      { personId: 'fernando', personName: 'Fernando', excelLoadsTotal: 27.5, excelPaymentsTotal: 50, excelBalance: 22.5, excelFinalBalance: 27.5, explanations: [{ label: 'Fondo Cassa', amount: 5 }] },
      { personId: 'nino', personName: 'Nino', excelLoadsTotal: 11, excelPaymentsTotal: 5, excelBalance: -6, excelFinalBalance: null, explanations: [] },
      { personId: 'daniele', personName: 'Daniele', excelLoadsTotal: 20, excelPaymentsTotal: 15, excelBalance: -5, excelFinalBalance: 0, explanations: [] },
    ];

    const result = compareBalanceTotals(appTotals, excelTotals, { tolerance: 0.01 });

    expect(result.ok).toBe(false);
    expect(result.rows.map((row) => [row.personId, row.status])).toEqual([
      ['fabio', 'OK'],
      ['fernando', 'EXPLAINED'],
      ['nino', 'FAIL'],
      ['daniele', 'FAIL'],
    ]);
    expect(formatValidationReport(result)).toContain('Fernando');
    expect(formatValidationReport(result)).toContain('differenza spiegata da Fondo Cassa 5.00');
  });

  it('valida i documenti creati da runImport contro i totali Excel base', async () => {
    const db = new FakeFirestore();
    const rows = [
      HEADER,
      [45792, 'Fabio', 1, 1, 0, 0, 2, 27.5, 27.5, 0, 0],
      ['Totale', 55, 1, 1, 0, 0, 2, 27.5, 27.5, 0, 0],
      ['di Acqua', 45, null, null, null, null, null, 'Anticipi'],
      [null, null, null, null, null, null, null, 'Fabio', 'Fernando'],
      [null, null, null, null, null, null, null, 50, 20],
    ];

    await runImport(db, parseHistoricalWorkbook(rows));
    const result = compareBalanceTotals(
      await readImportedAppTotals(db),
      parseExcelValidationTotals(rows),
    );

    expect(result.ok).toBe(true);
    expect(result.rows.find((row) => row.personId === 'fabio')).toMatchObject({
      appLoadsTotal: 27.5,
      appPaymentsTotal: 50,
      appBalance: 22.5,
      status: 'OK',
    });
  });
});

class FakeFirestore {
  constructor() {
    this.data = { people: {}, loads: {}, payments: {} };
  }
  collection(name) {
    return {
      doc: (id) => ({ db: this, collectionName: name, id, path: `${name}/${id}`, get: async () => ({ exists: id in this.data[name] }) }),
      get: async () => ({
        docs: Object.entries(this.data[name]).map(([id, value]) => ({
          id,
          data: () => value,
        })),
      }),
    };
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

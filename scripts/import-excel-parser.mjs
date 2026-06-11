import { readFile } from 'node:fs/promises';
import * as XLSX from 'xlsx';

export const DEFAULT_WORKBOOK_PATH = 'docs/2025_GestioneAcqua.xlsx';
export const HISTORICAL_ADVANCE_DATE = new Date(Date.UTC(2025, 0, 1));
export const PEOPLE = [
  { id: 'fabio', name: 'Fabio', initials: 'Fa' },
  { id: 'fernando', name: 'Fernando', initials: 'Fe' },
  { id: 'daniele', name: 'Daniele', initials: 'Da' },
  { id: 'nino', name: 'Nino', initials: 'Ni' },
];

const PERSON_BY_NAME = new Map(PEOPLE.map((person) => [normalizeText(person.name), person]));

export function excelSerialToDate(serial) {
  if (!Number.isFinite(serial)) throw new Error(`Data Excel non valida: ${serial}`);
  return new Date((serial - 25569) * 86400000);
}

export function normalizePersonId(value) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  for (const [name, person] of PERSON_BY_NAME) {
    if (normalized.includes(name)) return person.id;
  }
  return null;
}

export async function readWorkbookRows(filePath = DEFAULT_WORKBOOK_PATH) {
  const workbook = XLSX.read(await readFile(filePath), { type: 'buffer', cellDates: false });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) throw new Error(`Workbook senza fogli: ${filePath}`);
  return XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: null, raw: true });
}

export function parseHistoricalWorkbook(rows) {
  const parsedLoads = parseLoads(rows);
  return {
    people: PEOPLE,
    loads: parsedLoads.loads,
    payments: parseAdvancePayments(rows),
    skippedRows: parsedLoads.skippedRows,
  };
}

export function parseLoads(rows) {
  const header = rows[0] ?? [];
  const waterPrice = toNumber(header[19]) ?? 0;
  const energyPrice = toNumber(header[20]) ?? 0;
  const columns = [
    ['fabio', 2, 7],
    ['fernando', 3, 8],
    ['daniele', 4, 9],
    ['nino', 5, 10],
  ];
  const loads = [];
  const skippedRows = [];
  let lastPaidByPersonId = null;

  rows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    const serialDate = toNumber(row[0]);
    const declaredTotalWeight = toNumber(row[6]);
    if (!serialDate || !declaredTotalWeight || declaredTotalWeight <= 0) {
      if ([0, 1, 2, 3, 4, 5, 6].some((cell) => row[cell] !== null && row[cell] !== '')) {
        skippedRows.push({ rowNumber, reason: 'riga senza data seriale o peso totale valido' });
      }
      return;
    }

    const paidByPersonId = normalizePersonId(row[1]) ?? lastPaidByPersonId;
    if (!paidByPersonId) {
      skippedRows.push({ rowNumber, reason: `pagatore non riconosciuto: ${String(row[1] ?? '')}` });
      return;
    }
    lastPaidByPersonId = paidByPersonId;

    const totalWeight = columns.reduce((sum, [, weightIndex]) => sum + (toNumber(row[weightIndex]) ?? 0), 0);
    const pricePerLoad = waterPrice + energyPrice;
    const breakdown = columns
      .map(([personId, weightIndex, costIndex]) => {
        const weight = toNumber(row[weightIndex]) ?? 0;
        return {
          personId,
          weight: roundNumber(weight),
          cost: roundNumber(toNumber(row[costIndex]) ?? (weight / totalWeight) * pricePerLoad),
        };
      })
      .filter((item) => item.weight > 0);

    loads.push({
      id: `excel-load-${rowNumber}`,
      sourceRow: rowNumber,
      date: excelSerialToDate(serialDate),
      paidByPersonId,
      waterPrice,
      energyPrice,
      totalAmount: roundNumber(breakdown.reduce((sum, item) => sum + item.cost, 0)),
      totalWeight: roundNumber(totalWeight),
      breakdown,
    });
  });
  return { loads, skippedRows };
}

export function parseAdvancePayments(rows) {
  const marker = findCell(rows, 'Anticipi');
  if (!marker) return [];
  const namesRow = rows[marker.row + 1] ?? [];
  const amountsRow = rows[marker.row + 2] ?? [];
  const rowNumber = marker.row + 3;
  const payments = [];

  for (let column = marker.column; column < namesRow.length; column++) {
    const personId = normalizePersonId(namesRow[column]);
    const amount = toNumber(amountsRow[column]);
    if (!personId || !amount || amount <= 0) continue;
    payments.push({
      id: `excel-payment-${personId}-${rowNumber}`,
      sourceRow: rowNumber,
      personId,
      amount: roundNumber(amount),
      date: HISTORICAL_ADVANCE_DATE,
      note: 'Import storico Excel - anticipo riepilogativo senza data puntuale',
    });
  }
  return payments;
}

function findCell(rows, expected) {
  const expectedText = normalizeText(expected);
  for (let row = 0; row < rows.length; row++) {
    for (let column = 0; column < (rows[row] ?? []).length; column++) {
      if (normalizeText(rows[row][column]) === expectedText) return { row, column };
    }
  }
  return null;
}

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const parsed = Number(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function roundNumber(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

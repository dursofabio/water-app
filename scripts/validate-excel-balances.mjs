#!/usr/bin/env node

import process from 'node:process';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  DEFAULT_WORKBOOK_PATH,
  PEOPLE,
  parseExcelValidationTotals,
  readWorkbookRows,
  roundNumber,
} from './import-excel-parser.mjs';

const DEFAULT_PROJECT_ID = 'acquaapp-dev';
const DEFAULT_TOLERANCE = 0.01;
const EXCEL_SOURCE = 'excel-2025';

export async function validateWorkbookAgainstFirestore(db, options = {}) {
  const rows = await readWorkbookRows(options.filePath ?? DEFAULT_WORKBOOK_PATH);
  const excelTotals = parseExcelValidationTotals(rows);
  const appTotals = await readImportedAppTotals(db);
  return compareBalanceTotals(appTotals, excelTotals, {
    tolerance: options.tolerance ?? DEFAULT_TOLERANCE,
  });
}

export async function readImportedAppTotals(db) {
  const [people, loads, payments] = await Promise.all([
    readCollection(db, 'people'),
    readCollection(db, 'loads'),
    readCollection(db, 'payments'),
  ]);
  const importedLoads = loads.filter(isExcelImportedDocument);
  const importedPayments = payments.filter(isExcelImportedDocument);

  if (importedLoads.length === 0 && importedPayments.length === 0) {
    throw new Error('Nessun documento importato da Excel trovato. Esegui prima npm run import:excel.');
  }

  return aggregateAppBalances({
    people: mergeKnownPeople(people),
    loads: importedLoads,
    payments: importedPayments,
  });
}

export function aggregateAppBalances({ people = PEOPLE, loads = [], payments = [] }) {
  return people.map((person) => {
    const appLoadsTotal = roundNumber(
      loads.reduce((sum, load) => sum + getLoadAmountForPerson(load, person.id), 0),
    );
    const appPaymentsTotal = roundNumber(
      payments
        .filter((payment) => payment.personId === person.id)
        .reduce((sum, payment) => sum + (toFiniteNumber(payment.amount) ?? 0), 0),
    );

    return {
      personId: person.id,
      personName: person.name,
      appLoadsTotal,
      appPaymentsTotal,
      appBalance: roundNumber(appPaymentsTotal - appLoadsTotal),
    };
  });
}

export function compareBalanceTotals(appTotals, excelTotals, options = {}) {
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  const appByPerson = new Map(appTotals.map((item) => [item.personId, item]));
  const rows = excelTotals.map((excel) => {
    const app = appByPerson.get(excel.personId) ?? {
      personId: excel.personId,
      personName: excel.personName,
      appLoadsTotal: 0,
      appPaymentsTotal: 0,
      appBalance: 0,
    };
    const deltaLoads = roundNumber(app.appLoadsTotal - excel.excelLoadsTotal);
    const deltaPayments = roundNumber(app.appPaymentsTotal - excel.excelPaymentsTotal);
    const deltaBalance = roundNumber(app.appBalance - excel.excelBalance);
    const finalDelta = excel.excelFinalBalance === null || excel.excelFinalBalance === undefined
      ? null
      : roundNumber(app.appBalance - excel.excelFinalBalance);
    const baseMatches = [deltaLoads, deltaPayments, deltaBalance].every((delta) => isWithinTolerance(delta, tolerance));
    const finalDiffers = finalDelta !== null && !isWithinTolerance(finalDelta, tolerance);
    let status = 'FAIL';
    if (baseMatches && !finalDiffers) status = 'OK';
    else if (baseMatches && excel.explanations.length > 0) status = 'EXPLAINED';

    return {
      personId: excel.personId,
      personName: excel.personName,
      appLoadsTotal: app.appLoadsTotal,
      excelLoadsTotal: excel.excelLoadsTotal,
      deltaLoads,
      appPaymentsTotal: app.appPaymentsTotal,
      excelPaymentsTotal: excel.excelPaymentsTotal,
      deltaPayments,
      appBalance: app.appBalance,
      excelBalance: excel.excelBalance,
      deltaBalance,
      excelFinalBalance: excel.excelFinalBalance,
      finalDelta,
      explanations: excel.explanations,
      status,
    };
  });

  return {
    tolerance,
    rows,
    ok: rows.every((row) => row.status === 'OK' || row.status === 'EXPLAINED'),
  };
}

export function formatValidationReport(result) {
  const tableRows = [
    [
      'Persona',
      'App carichi',
      'Excel carichi',
      'Delta carichi',
      'App pagamenti',
      'Excel pagamenti',
      'Delta pagamenti',
      'App saldo',
      'Excel saldo',
      'Delta saldo',
      'Esito',
    ],
    ...result.rows.map((row) => [
      row.personName,
      formatEuro(row.appLoadsTotal),
      formatEuro(row.excelLoadsTotal),
      formatEuro(row.deltaLoads),
      formatEuro(row.appPaymentsTotal),
      formatEuro(row.excelPaymentsTotal),
      formatEuro(row.deltaPayments),
      formatEuro(row.appBalance),
      formatEuro(row.excelBalance),
      formatEuro(row.deltaBalance),
      row.status,
    ]),
  ];
  const widths = tableRows[0].map((_, column) =>
    Math.max(...tableRows.map((row) => row[column].length)),
  );
  const table = tableRows
    .map((row) => row.map((cell, column) => cell.padEnd(widths[column])).join('  '))
    .join('\n');
  const notes = result.rows.flatMap((row) => {
    if (!row.explanations.length || row.finalDelta === null || row.status !== 'EXPLAINED') return [];
    const labels = row.explanations
      .map((entry) => `${entry.label} ${formatEuro(entry.amount)}`)
      .join(', ');
    return [
      `- ${row.personName}: saldo finale Excel ${formatEuro(row.excelFinalBalance)} diverso dal saldo app ${formatEuro(row.appBalance)}; differenza spiegata da ${labels}.`,
    ];
  });

  return [
    'Validazione saldi Excel completata',
    `Tolleranza: ${formatEuro(result.tolerance)} EUR`,
    '',
    table,
    notes.length ? ['', 'Note:', ...notes].join('\n') : '',
  ].filter(Boolean).join('\n');
}

function parseArgs(args) {
  const options = {
    filePath: DEFAULT_WORKBOOK_PATH,
    projectId: DEFAULT_PROJECT_ID,
    tolerance: DEFAULT_TOLERANCE,
    json: false,
    allowProduction: false,
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--allow-production') options.allowProduction = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--file') options.filePath = args[++index];
    else if (arg === '--project') options.projectId = args[++index];
    else if (arg === '--tolerance') options.tolerance = parseTolerance(args[++index]);
    else throw new Error(`Argomento non riconosciuto: ${arg}`);
  }

  return options;
}

function parseTolerance(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Tolleranza non valida: ${value}`);
  return parsed;
}

async function readCollection(db, name) {
  const snapshot = await db.collection(name).get();
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
}

function mergeKnownPeople(people) {
  const byId = new Map(PEOPLE.map((person) => [person.id, person]));
  for (const person of people) {
    if (person.id) byId.set(person.id, { ...byId.get(person.id), ...person });
  }
  return PEOPLE.map((person) => byId.get(person.id));
}

function isExcelImportedDocument(document) {
  return document.source === EXCEL_SOURCE || String(document.id ?? '').startsWith('excel-');
}

function getLoadAmountForPerson(load, personId) {
  if (!Array.isArray(load.breakdown)) {
    return load.personId === personId ? (toFiniteNumber(load.amount) ?? 0) : 0;
  }

  return load.breakdown
    .filter((item) => item.personId === personId)
    .reduce((sum, item) => sum + (toFiniteNumber(item.cost) ?? toFiniteNumber(item.amount) ?? 0), 0);
}

function toFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isWithinTolerance(delta, tolerance) {
  return Math.abs(delta) <= tolerance;
}

function formatEuro(value) {
  return Number(value ?? 0).toFixed(2);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!process.env.FIRESTORE_EMULATOR_HOST && !options.allowProduction) {
    throw new Error('Validazione bloccata: imposta FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 oppure passa --allow-production intenzionalmente.');
  }
  if (getApps().length === 0) initializeApp({ projectId: options.projectId });

  const result = await validateWorkbookAgainstFirestore(getFirestore(), options);
  console.log(options.json ? JSON.stringify(result, null, 2) : formatValidationReport(result));
  if (!result.ok) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

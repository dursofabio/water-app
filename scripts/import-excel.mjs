#!/usr/bin/env node

import process from 'node:process';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { DEFAULT_WORKBOOK_PATH, parseHistoricalWorkbook, readWorkbookRows } from './import-excel-parser.mjs';

const DEFAULT_PROJECT_ID = 'acquaapp-dev';

class ImportAlreadyExistsError extends Error {
  constructor(existingIds) {
    super(`Import storico gia presente: ${existingIds.join(', ')}`);
  }
}

export async function runImport(db, parsed, options = {}) {
  const refs = [
    ...parsed.loads.map((load) => db.collection('loads').doc(load.id)),
    ...parsed.payments.map((payment) => db.collection('payments').doc(payment.id)),
  ];
  if (!options.force) {
    const existing = (await Promise.all(refs.map((ref) => ref.get())))
      .map((snapshot, index) => (snapshot.exists ? refs[index].path : null))
      .filter(Boolean);
    if (existing.length) throw new ImportAlreadyExistsError(existing);
  }

  const batch = db.batch();
  parsed.people.forEach((person) => batch.set(db.collection('people').doc(person.id), person, { merge: true }));
  parsed.loads.forEach(({ id, sourceRow, date, ...load }) => {
    batch.set(db.collection('loads').doc(id), {
      ...load,
      source: 'excel-2025',
      sourceRow,
      date: Timestamp.fromDate(date),
    });
  });
  parsed.payments.forEach(({ id, sourceRow, date, ...payment }) => {
    batch.set(db.collection('payments').doc(id), {
      ...payment,
      source: 'excel-2025',
      sourceRow,
      date: Timestamp.fromDate(date),
    });
  });
  await batch.commit();
  return buildSummary(parsed, options);
}

export function buildSummary(parsed, options = {}) {
  return {
    peopleVerified: parsed.people.length,
    loadsImported: parsed.loads.length,
    paymentsImported: parsed.payments.length,
    skippedRows: parsed.skippedRows,
    force: options.force === true,
  };
}

export async function importWorkbookToFirestore(db, options = {}) {
  const rows = await readWorkbookRows(options.filePath ?? DEFAULT_WORKBOOK_PATH);
  return runImport(db, parseHistoricalWorkbook(rows), options);
}

function parseArgs(args) {
  const options = { filePath: DEFAULT_WORKBOOK_PATH, projectId: DEFAULT_PROJECT_ID, force: false, allowProduction: false };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--force') options.force = true;
    else if (arg === '--allow-production') options.allowProduction = true;
    else if (arg === '--file') options.filePath = args[++index];
    else if (arg === '--project') options.projectId = args[++index];
    else throw new Error(`Argomento non riconosciuto: ${arg}`);
  }
  return options;
}

function printSummary(summary) {
  console.log('Import storico Excel completato.');
  console.log(`  Persone verificate: ${summary.peopleVerified}`);
  console.log(`  Carichi importati: ${summary.loadsImported}`);
  console.log(`  Pagamenti importati: ${summary.paymentsImported}`);
  console.log(`  Righe scartate: ${summary.skippedRows.length}`);
  summary.skippedRows.forEach((row) => console.log(`    Riga ${row.rowNumber}: ${row.reason}`));
  if (summary.force) console.log('  Modalita force: documenti import Excel sovrascritti.');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!process.env.FIRESTORE_EMULATOR_HOST && !args.allowProduction) {
    throw new Error('Import bloccato: imposta FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 oppure passa --allow-production intenzionalmente.');
  }
  if (getApps().length === 0) initializeApp({ projectId: args.projectId });
  printSummary(await importWorkbookToFirestore(getFirestore(), args));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    if (error instanceof ImportAlreadyExistsError) {
      console.error('Esegui con --force solo se vuoi sovrascrivere l import Excel esistente.');
    }
    process.exit(1);
  });
}

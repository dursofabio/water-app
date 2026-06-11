import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';

const testEnv = await initializeTestEnvironment({
  projectId: 'acquaapp-dev',
  firestore: { host: '127.0.0.1', port: 8080 },
});

async function clearCollection(db, name) {
  const snap = await getDocs(collection(db, name));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();

  console.log('Pulizia collezioni...');
  await Promise.all([
    clearCollection(db, 'people'),
    clearCollection(db, 'loads'),
    clearCollection(db, 'payments'),
  ]);

  console.log('Inserimento persone...');
  await Promise.all([
    setDoc(doc(db, 'people', 'fernando'), { name: 'Fernando', initials: 'Fe' }),
    setDoc(doc(db, 'people', 'nino'), { name: 'Nino', initials: 'Ni' }),
    setDoc(doc(db, 'people', 'daniele'), { name: 'Daniele', initials: 'Da' }),
    setDoc(doc(db, 'people', 'fabio'), { name: 'Fabio', initials: 'Fa' }),
  ]);

  console.log('Inserimento carichi canonici...');
  await Promise.all([
    addDoc(collection(db, 'loads'), {
      date: new Date('2026-01-10T10:00:00.000Z'),
      paidByPersonId: 'fabio',
      totalAmount: 140.0,
      waterPrice: 100.0,
      energyPrice: 40.0,
      breakdown: [
        { personId: 'fernando', weight: 3, amount: 45.0 },
        { personId: 'nino', weight: 3, amount: 45.0 },
        { personId: 'daniele', weight: 1, amount: 15.0 },
        { personId: 'fabio', weight: 7 / 3, amount: 35.0 },
      ],
    }),
    addDoc(collection(db, 'loads'), {
      date: new Date('2026-02-10T10:00:00.000Z'),
      paidByPersonId: 'fernando',
      totalAmount: 140.0,
      waterPrice: 95.0,
      energyPrice: 45.0,
      breakdown: [
        { personId: 'fernando', weight: 2, amount: 30.0 },
        { personId: 'nino', weight: 1, amount: 15.0 },
        { personId: 'daniele', weight: 2 / 3, amount: 10.0 },
        { personId: 'fabio', weight: 17 / 3, amount: 85.0 },
      ],
    }),
  ]);

  console.log('Inserimento pagamenti...');
  await Promise.all([
    addDoc(collection(db, 'payments'), {
      date: new Date('2026-06-10T10:00:00.000Z'),
      personId: 'fernando',
      amount: 100.0,
      note: 'Bonifico istantaneo',
    }),
    addDoc(collection(db, 'payments'), {
      date: new Date('2026-06-06T10:00:00.000Z'),
      personId: 'nino',
      amount: 30.0,
    }),
    addDoc(collection(db, 'payments'), {
      date: new Date('2026-06-09T10:00:00.000Z'),
      personId: 'fabio',
      amount: 120.0,
      note: 'Quota carico',
    }),
  ]);
});

await testEnv.cleanup();

console.log('Seed completato.');
console.log('  fernando: carichi 75 - pagamenti 100 = saldo -25 (credito)');
console.log('  nino:     carichi 60 - pagamenti  30 = saldo +30 (debito medio)');
console.log('  daniele:  carichi 25 - pagamenti   0 = saldo +25 (debito medio)');
console.log('  fabio:    carichi 120- pagamenti 120 = saldo   0 (pari)');

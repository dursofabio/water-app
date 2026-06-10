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

  console.log('Inserimento carichi...');
  await Promise.all([
    addDoc(collection(db, 'loads'), { personId: 'fernando', amount: 45.0 }),
    addDoc(collection(db, 'loads'), { personId: 'fernando', amount: 30.0 }),
    addDoc(collection(db, 'loads'), { personId: 'nino', amount: 60.0 }),
    addDoc(collection(db, 'loads'), { personId: 'daniele', amount: 25.0 }),
    addDoc(collection(db, 'loads'), { personId: 'fabio', amount: 80.0 }),
    addDoc(collection(db, 'loads'), { personId: 'fabio', amount: 40.0 }),
  ]);

  console.log('Inserimento pagamenti...');
  await Promise.all([
    addDoc(collection(db, 'payments'), { personId: 'fernando', amount: 100.0 }),
    addDoc(collection(db, 'payments'), { personId: 'nino', amount: 30.0 }),
    addDoc(collection(db, 'payments'), { personId: 'fabio', amount: 120.0 }),
  ]);
});

await testEnv.cleanup();

console.log('Seed completato.');
console.log('  fernando: carichi 75 - pagamenti 100 = saldo -25 (credito)');
console.log('  nino:     carichi 60 - pagamenti  30 = saldo +30 (debito medio)');
console.log('  daniele:  carichi 25 - pagamenti   0 = saldo +25 (debito medio)');
console.log('  fabio:    carichi 120- pagamenti 120 = saldo   0 (pari)');

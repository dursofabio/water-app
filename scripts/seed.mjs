import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';

const AUTH_URL = 'http://127.0.0.1:9099';
const PROJECT_ID = 'acquaapp-dev';
const DEV_ADMIN_UID = 'dev-admin';

async function seedAuthAdmin() {
  // Clear all existing auth users
  await fetch(`${AUTH_URL}/emulator/v1/projects/${PROJECT_ID}/accounts`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer owner' },
  });

  // Create fixed admin user with Google provider
  const res = await fetch(
    `${AUTH_URL}/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({
        localId: DEV_ADMIN_UID,
        email: 'fabio.durso.89@gmail.com',
        displayName: "Fabio D'Urso",
        emailVerified: true,
        providerUserInfo: [
          {
            providerId: 'google.com',
            rawId: 'dev-admin-google',
            email: 'fabio.durso.89@gmail.com',
            displayName: "Fabio D'Urso",
          },
        ],
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Auth emulator error: ${body}`);
  }
}

console.log('Seed Auth Emulator...');
await seedAuthAdmin();

const testEnv = await initializeTestEnvironment({
  projectId: PROJECT_ID,
  firestore: { host: '127.0.0.1', port: 8080 },
});

async function clearCollection(db, name) {
  const snap = await getDocs(collection(db, name));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

const LOADS = [
  { date: new Date('2025-05-15T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 2,    breakdown: [{ personId: 'fabio', weight: 1, cost: 27.5 }, { personId: 'fernando', weight: 1, cost: 27.5 }] },
  { date: new Date('2025-06-04T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 2,    breakdown: [{ personId: 'fabio', weight: 1, cost: 27.5 }, { personId: 'fernando', weight: 1, cost: 27.5 }] },
  { date: new Date('2025-06-17T00:00:00.000Z'), paidByPersonId: 'fernando', waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 2,    breakdown: [{ personId: 'fabio', weight: 1, cost: 27.5 }, { personId: 'fernando', weight: 1, cost: 27.5 }] },
  { date: new Date('2025-06-30T00:00:00.000Z'), paidByPersonId: 'fernando', waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 3,    breakdown: [{ personId: 'fabio', weight: 1, cost: 18.33 }, { personId: 'fernando', weight: 2, cost: 36.67 }] },
  { date: new Date('2025-07-12T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 4,    breakdown: [{ personId: 'fabio', weight: 1, cost: 13.75 }, { personId: 'fernando', weight: 2, cost: 27.5 }, { personId: 'nino', weight: 1, cost: 13.75 }] },
  { date: new Date('2025-07-21T00:00:00.000Z'), paidByPersonId: 'fernando', waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 5,    breakdown: [{ personId: 'fabio', weight: 1, cost: 11 }, { personId: 'fernando', weight: 2, cost: 22 }, { personId: 'daniele', weight: 1, cost: 11 }, { personId: 'nino', weight: 1, cost: 11 }] },
  { date: new Date('2025-07-30T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 4,    breakdown: [{ personId: 'fabio', weight: 1, cost: 13.75 }, { personId: 'fernando', weight: 1, cost: 13.75 }, { personId: 'daniele', weight: 1, cost: 13.75 }, { personId: 'nino', weight: 1, cost: 13.75 }] },
  { date: new Date('2025-08-20T00:00:00.000Z'), paidByPersonId: 'nino',     waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 5,    breakdown: [{ personId: 'fabio', weight: 1, cost: 11 }, { personId: 'fernando', weight: 1, cost: 11 }, { personId: 'daniele', weight: 2, cost: 22 }, { personId: 'nino', weight: 1, cost: 11 }] },
  { date: new Date('2025-08-16T00:00:00.000Z'), paidByPersonId: 'nino',     waterPrice: 45, energyPrice: 10, totalAmount: 55.01, totalWeight: 5.25, breakdown: [{ personId: 'fabio', weight: 1.25, cost: 13.1 }, { personId: 'fernando', weight: 1, cost: 10.48 }, { personId: 'daniele', weight: 2, cost: 20.95 }, { personId: 'nino', weight: 1, cost: 10.48 }] },
  { date: new Date('2025-08-23T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 4,    breakdown: [{ personId: 'fabio', weight: 1, cost: 13.75 }, { personId: 'fernando', weight: 1, cost: 13.75 }, { personId: 'daniele', weight: 1, cost: 13.75 }, { personId: 'nino', weight: 1, cost: 13.75 }] },
  { date: new Date('2025-09-30T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 4,    breakdown: [{ personId: 'fabio', weight: 1, cost: 13.75 }, { personId: 'fernando', weight: 1, cost: 13.75 }, { personId: 'daniele', weight: 1, cost: 13.75 }, { personId: 'nino', weight: 1, cost: 13.75 }] },
  { date: new Date('2025-09-05T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 4,    breakdown: [{ personId: 'fabio', weight: 1, cost: 13.75 }, { personId: 'fernando', weight: 1, cost: 13.75 }, { personId: 'daniele', weight: 1, cost: 13.75 }, { personId: 'nino', weight: 1, cost: 13.75 }] },
  { date: new Date('2025-09-16T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 4,    breakdown: [{ personId: 'fabio', weight: 1, cost: 13.75 }, { personId: 'fernando', weight: 1, cost: 13.75 }, { personId: 'daniele', weight: 1, cost: 13.75 }, { personId: 'nino', weight: 1, cost: 13.75 }] },
  { date: new Date('2025-09-25T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 54.99, totalWeight: 3,    breakdown: [{ personId: 'fabio', weight: 1, cost: 18.33 }, { personId: 'daniele', weight: 1, cost: 18.33 }, { personId: 'nino', weight: 1, cost: 18.33 }] },
  { date: new Date('2025-10-07T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 54.99, totalWeight: 7,    breakdown: [{ personId: 'fabio', weight: 3, cost: 23.57 }, { personId: 'daniele', weight: 2, cost: 15.71 }, { personId: 'nino', weight: 2, cost: 15.71 }] },
  { date: new Date('2025-10-25T00:00:00.000Z'), paidByPersonId: 'daniele',  waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 5,    breakdown: [{ personId: 'fabio', weight: 3, cost: 33 }, { personId: 'daniele', weight: 2, cost: 22 }] },
  { date: new Date('2025-11-05T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 5,    breakdown: [{ personId: 'fabio', weight: 3, cost: 33 }, { personId: 'daniele', weight: 2, cost: 22 }] },
  { date: new Date('2025-11-26T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 4,    breakdown: [{ personId: 'fabio', weight: 2, cost: 27.5 }, { personId: 'daniele', weight: 2, cost: 27.5 }] },
  { date: new Date('2025-12-12T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 4,    breakdown: [{ personId: 'fabio', weight: 2, cost: 27.5 }, { personId: 'daniele', weight: 2, cost: 27.5 }] },
  { date: new Date('2025-12-20T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 2,    breakdown: [{ personId: 'fabio', weight: 1, cost: 27.5 }, { personId: 'daniele', weight: 1, cost: 27.5 }] },
  { date: new Date('2026-01-10T00:00:00.000Z'), paidByPersonId: 'daniele',  waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 2,    breakdown: [{ personId: 'fabio', weight: 1, cost: 27.5 }, { personId: 'daniele', weight: 1, cost: 27.5 }] },
  { date: new Date('2026-01-27T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 3,    breakdown: [{ personId: 'fabio', weight: 2, cost: 36.67 }, { personId: 'daniele', weight: 1, cost: 18.33 }] },
  { date: new Date('2026-02-18T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 2,    breakdown: [{ personId: 'fabio', weight: 1, cost: 27.5 }, { personId: 'daniele', weight: 1, cost: 27.5 }] },
  { date: new Date('2026-03-05T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 2,    breakdown: [{ personId: 'fabio', weight: 1, cost: 27.5 }, { personId: 'daniele', weight: 1, cost: 27.5 }] },
  { date: new Date('2026-03-21T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 2,    breakdown: [{ personId: 'fabio', weight: 1, cost: 27.5 }, { personId: 'daniele', weight: 1, cost: 27.5 }] },
  { date: new Date('2026-04-04T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 2,    breakdown: [{ personId: 'fabio', weight: 1, cost: 27.5 }, { personId: 'daniele', weight: 1, cost: 27.5 }] },
  { date: new Date('2026-04-17T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 2,    breakdown: [{ personId: 'fabio', weight: 1, cost: 27.5 }, { personId: 'daniele', weight: 1, cost: 27.5 }] },
  { date: new Date('2026-04-30T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 3,    breakdown: [{ personId: 'fabio', weight: 2, cost: 36.67 }, { personId: 'daniele', weight: 1, cost: 18.33 }] },
  { date: new Date('2026-05-20T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 4,    breakdown: [{ personId: 'fabio', weight: 2, cost: 27.5 }, { personId: 'fernando', weight: 1, cost: 13.75 }, { personId: 'daniele', weight: 1, cost: 13.75 }] },
  { date: new Date('2026-05-29T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 5,    breakdown: [{ personId: 'fabio', weight: 2, cost: 22 }, { personId: 'fernando', weight: 1, cost: 11 }, { personId: 'daniele', weight: 2, cost: 22 }] },
  { date: new Date('2026-06-10T00:00:00.000Z'), paidByPersonId: 'fabio',    waterPrice: 45, energyPrice: 10, totalAmount: 55,    totalWeight: 2,    breakdown: [{ personId: 'fabio', weight: 1, cost: 27.5 }, { personId: 'daniele', weight: 1, cost: 27.5 }] },
];

await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();

  console.log('Pulizia collezioni...');
  await Promise.all([
    clearCollection(db, 'people'),
    clearCollection(db, 'loads'),
    clearCollection(db, 'payments'),
    clearCollection(db, 'admins'),
  ]);

  console.log('Inserimento admin...');
  await setDoc(doc(db, 'admins', DEV_ADMIN_UID), { email: 'fabio.durso.89@gmail.com' });

  console.log('Inserimento persone...');
  await Promise.all([
    setDoc(doc(db, 'people', 'fernando'), { name: 'Fernando', initials: 'Fe' }),
    setDoc(doc(db, 'people', 'nino'), { name: 'Nino', initials: 'Ni' }),
    setDoc(doc(db, 'people', 'daniele'), { name: 'Daniele', initials: 'Da' }),
    setDoc(doc(db, 'people', 'fabio'), { name: 'Fabio', initials: 'Fa' }),
  ]);

  console.log('Inserimento carichi...');
  await Promise.all(LOADS.map((load) => addDoc(collection(db, 'loads'), load)));

  console.log('Inserimento pagamenti...');
  await Promise.all([
    // 2025
    addDoc(collection(db, 'payments'), { date: new Date('2025-06-17T10:00:00.000Z'), personId: 'fernando', amount: 200.0 }),
    addDoc(collection(db, 'payments'), { date: new Date('2025-07-12T10:00:00.000Z'), personId: 'nino',     amount: 100.0 }),
    addDoc(collection(db, 'payments'), { date: new Date('2025-08-11T10:00:00.000Z'), personId: 'daniele',  amount:  50.0 }),
    addDoc(collection(db, 'payments'), { date: new Date('2025-09-15T10:00:00.000Z'), personId: 'daniele',  amount:  50.0 }),
    addDoc(collection(db, 'payments'), { date: new Date('2025-10-12T10:00:00.000Z'), personId: 'nino',     amount:  50.0 }),
    addDoc(collection(db, 'payments'), { date: new Date('2025-10-17T10:00:00.000Z'), personId: 'daniele',  amount:  50.0 }),
    addDoc(collection(db, 'payments'), { date: new Date('2025-10-25T10:00:00.000Z'), personId: 'daniele',  amount:  45.0 }),
    addDoc(collection(db, 'payments'), { date: new Date('2025-11-26T10:00:00.000Z'), personId: 'daniele',  amount:  45.0 }),
    // fabio — un pagamento per ogni carico da lui anticipato
    addDoc(collection(db, 'payments'), { date: new Date('2025-05-15T00:00:00.000Z'), personId: 'fabio', amount: 55 }),
    addDoc(collection(db, 'payments'), { date: new Date('2025-07-12T00:00:00.000Z'), personId: 'fabio', amount: 55 }),
    addDoc(collection(db, 'payments'), { date: new Date('2025-08-23T00:00:00.000Z'), personId: 'fabio', amount: 55 }),
    addDoc(collection(db, 'payments'), { date: new Date('2025-09-25T00:00:00.000Z'), personId: 'fabio', amount: 55 }),
    addDoc(collection(db, 'payments'), { date: new Date('2025-09-30T00:00:00.000Z'), personId: 'fabio', amount: 55 }),
    addDoc(collection(db, 'payments'), { date: new Date('2025-11-26T00:00:00.000Z'), personId: 'fabio', amount: 55 }),
    addDoc(collection(db, 'payments'), { date: new Date('2026-01-27T00:00:00.000Z'), personId: 'fabio', amount: 55 }),
    addDoc(collection(db, 'payments'), { date: new Date('2026-03-05T00:00:00.000Z'), personId: 'fabio', amount: 55 }),
    addDoc(collection(db, 'payments'), { date: new Date('2026-03-21T00:00:00.000Z'), personId: 'fabio', amount: 55 }),
    addDoc(collection(db, 'payments'), { date: new Date('2026-04-17T00:00:00.000Z'), personId: 'fabio', amount: 55 }),
    addDoc(collection(db, 'payments'), { date: new Date('2026-04-30T00:00:00.000Z'), personId: 'fabio', amount: 55 }),
    addDoc(collection(db, 'payments'), { date: new Date('2026-05-29T00:00:00.000Z'), personId: 'fabio', amount: 55 }),
    addDoc(collection(db, 'payments'), { date: new Date('2026-06-10T00:00:00.000Z'), personId: 'fabio', amount: 55 }),
    // 2026
    addDoc(collection(db, 'payments'), { date: new Date('2026-01-02T10:00:00.000Z'), personId: 'fernando', amount:  60.0 }),
    addDoc(collection(db, 'payments'), { date: new Date('2026-01-09T10:00:00.000Z'), personId: 'daniele',  amount:  50.0 }),
    addDoc(collection(db, 'payments'), { date: new Date('2026-01-10T10:00:00.000Z'), personId: 'daniele',  amount:  45.0 }),
    addDoc(collection(db, 'payments'), { date: new Date('2026-03-12T10:00:00.000Z'), personId: 'daniele',  amount:  46.0 }),
    addDoc(collection(db, 'payments'), { date: new Date('2026-04-26T10:00:00.000Z'), personId: 'daniele',  amount:  50.0 }),
    addDoc(collection(db, 'payments'), { date: new Date('2026-05-01T10:00:00.000Z'), personId: 'daniele',  amount:  35.0 }),
  ]);
});

await testEnv.cleanup();

console.log('Seed completato.');
console.log('  admin: UID=dev-admin (fabio.durso.89@gmail.com) — selezionalo nel popup emulator');
console.log(`  carichi: ${LOADS.length}`);
console.log('  pagamenti reali 2025-2026: fernando 260, nino 150, daniele 471');

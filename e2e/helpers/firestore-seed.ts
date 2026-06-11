import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { addDoc, collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';

const projectId = 'acquaapp-dev';

export type SeedEnvironment = RulesTestEnvironment;

export async function createSeedEnvironment(): Promise<SeedEnvironment> {
  return initializeTestEnvironment({
    projectId,
    firestore: { host: '127.0.0.1', port: 8080 },
  });
}

export async function seedCanonicalDashboardData(
  testEnv: SeedEnvironment,
  options: { includePayments?: boolean } = {},
): Promise<void> {
  const includePayments = options.includePayments ?? true;

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();

    await Promise.all([
      clearCollection(db, 'people'),
      clearCollection(db, 'loads'),
      clearCollection(db, 'payments'),
    ]);

    await Promise.all([
      setDoc(doc(db, 'people', 'fernando'), { name: 'Fernando', initials: 'Fe' }),
      setDoc(doc(db, 'people', 'nino'), { name: 'Nino', initials: 'Ni' }),
      setDoc(doc(db, 'people', 'daniele'), { name: 'Daniele', initials: 'Da' }),
      setDoc(doc(db, 'people', 'fabio'), { name: 'Fabio', initials: 'Fa' }),
    ]);

    await Promise.all([
      addDoc(collection(db, 'loads'), {
        date: new Date('2026-06-09T10:00:00.000Z'),
        paidByPersonId: 'fabio',
        totalAmount: 120,
        waterPrice: 100,
        energyPrice: 20,
        breakdown: [
          { personId: 'fernando', weight: 2, amount: 20 },
          { personId: 'nino', weight: 3, amount: 30 },
          { personId: 'daniele', weight: 2.5, amount: 25 },
          { personId: 'fabio', weight: 4.5, amount: 45 },
        ],
      }),
      addDoc(collection(db, 'loads'), {
        date: new Date('2026-06-02T10:00:00.000Z'),
        paidByPersonId: 'fernando',
        totalAmount: 75,
        waterPrice: 60,
        energyPrice: 15,
        breakdown: [
          { personId: 'fernando', weight: 2, amount: 15 },
          { personId: 'nino', weight: 2, amount: 15 },
          { personId: 'daniele', weight: 3, amount: 22.5 },
          { personId: 'fabio', weight: 3, amount: 22.5 },
        ],
      }),
      addDoc(collection(db, 'loads'), {
        date: new Date('2026-05-21T10:00:00.000Z'),
        paidByPersonId: 'nino',
        totalAmount: 60,
        waterPrice: 45,
        energyPrice: 15,
        breakdown: [
          { personId: 'fernando', weight: 1, amount: 7.5 },
          { personId: 'nino', weight: 3, amount: 22.5 },
          { personId: 'daniele', weight: 2, amount: 15 },
          { personId: 'fabio', weight: 2, amount: 15 },
        ],
      }),
    ]);

    if (includePayments) {
      await Promise.all([
        addDoc(collection(db, 'payments'), {
          date: new Date('2026-06-10T10:00:00.000Z'),
          personId: 'fernando',
          amount: 100,
          note: 'Bonifico istantaneo',
        }),
        addDoc(collection(db, 'payments'), {
          date: new Date('2026-06-09T10:00:00.000Z'),
          personId: 'fabio',
          amount: 120,
          note: 'Quota carico',
        }),
        addDoc(collection(db, 'payments'), {
          date: new Date('2026-06-06T10:00:00.000Z'),
          personId: 'nino',
          amount: 30,
        }),
        addDoc(collection(db, 'payments'), {
          date: new Date('2026-06-03T10:00:00.000Z'),
          personId: 'daniele',
          amount: 25,
          note: 'Contanti',
        }),
        addDoc(collection(db, 'payments'), {
          date: new Date('2026-05-29T10:00:00.000Z'),
          personId: 'fernando',
          amount: 40,
        }),
        addDoc(collection(db, 'payments'), {
          date: new Date('2026-05-25T10:00:00.000Z'),
          personId: 'fabio',
          amount: 45,
          note: 'Saldo precedente',
        }),
        addDoc(collection(db, 'payments'), {
          date: new Date('2026-05-21T10:00:00.000Z'),
          personId: 'nino',
          amount: 60,
        }),
        addDoc(collection(db, 'payments'), {
          date: new Date('2026-05-18T10:00:00.000Z'),
          personId: 'daniele',
          amount: 15,
          note: 'Rimborso parziale',
        }),
        addDoc(collection(db, 'payments'), {
          date: new Date('2026-05-12T10:00:00.000Z'),
          personId: 'fernando',
          amount: 35,
        }),
        addDoc(collection(db, 'payments'), {
          date: new Date('2026-05-08T10:00:00.000Z'),
          personId: 'fabio',
          amount: 20,
        }),
      ]);
    }
  });
}

export async function insertRealtimeLoad(testEnv: SeedEnvironment): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await addDoc(collection(db, 'loads'), {
      date: new Date('2026-06-11T10:00:00.000Z'),
      paidByPersonId: 'daniele',
      totalAmount: 90,
      waterPrice: 70,
      energyPrice: 20,
      breakdown: [
        { personId: 'fernando', weight: 2, amount: 18 },
        { personId: 'nino', weight: 2, amount: 18 },
        { personId: 'daniele', weight: 3, amount: 27 },
        { personId: 'fabio', weight: 3, amount: 27 },
      ],
    });
  });
}

export async function insertRealtimePayment(testEnv: SeedEnvironment): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await addDoc(collection(db, 'payments'), {
      date: new Date('2026-06-11T10:00:00.000Z'),
      personId: 'daniele',
      amount: 55,
      note: 'Pagamento appena registrato',
    });
  });
}

/** Seed /config/prices with the standard prices used in US-008 tests. */
export async function seedConfigPrices(
  testEnv: SeedEnvironment,
  prices: { waterPrice: number; energyPrice: number } = { waterPrice: 35, energyPrice: 10 },
): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'config', 'prices'), prices);
  });
}

async function clearCollection(db: ReturnType<SeedEnvironment['unauthenticatedContext']>['firestore'], name: string): Promise<void> {
  const snap = await getDocs(collection(db, name));
  await Promise.all(snap.docs.map((document) => deleteDoc(document.ref)));
}

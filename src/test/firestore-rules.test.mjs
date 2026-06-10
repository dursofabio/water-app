/**
 * Firestore Security Rules Test (US-002 — TASK-08)
 *
 * Requires the Firestore emulator running on 127.0.0.1:8080.
 * Start with: firebase emulators:start --only firestore
 *
 * Run with: node src/test/firestore-rules.test.mjs
 *
 * Tests:
 * 1. Anonymous read on /loads → success (allow read: if true)
 * 2. Unauthenticated write on /loads → PERMISSION_DENIED
 * 3. Unauthenticated read on /people → success (allow read: if true)
 * 4. Unauthenticated read on /payments → success (allow read: if true)
 * 5. Unauthenticated read on /config → success (allow read: if true)
 * 6. Unauthenticated read on /admins → PERMISSION_DENIED (requires auth)
 */

import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectId = 'acquaapp-rules-test';
const firestoreRules = readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8');

let testEnv;

async function runTests() {
  console.log('🧪 Initializing Firestore Rules test environment...');

  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: firestoreRules,
    },
  });

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ ${name}`);
      console.error(`     ${err.message}`);
      failed++;
    }
  }

  // Anonymous context (unauthenticated)
  const anonymousDb = testEnv.unauthenticatedContext().firestore();

  await test('Anonymous read on /loads → success', async () => {
    await assertSucceeds(
      anonymousDb.collection('loads').get()
    );
  });

  await test('Anonymous write on /loads → PERMISSION_DENIED', async () => {
    await assertFails(
      anonymousDb.collection('loads').add({ test: true })
    );
  });

  await test('Anonymous read on /people → success', async () => {
    await assertSucceeds(
      anonymousDb.collection('people').get()
    );
  });

  await test('Anonymous write on /people → PERMISSION_DENIED', async () => {
    await assertFails(
      anonymousDb.collection('people').add({ test: true })
    );
  });

  await test('Anonymous read on /payments → success', async () => {
    await assertSucceeds(
      anonymousDb.collection('payments').get()
    );
  });

  await test('Anonymous read on /config → success', async () => {
    await assertSucceeds(
      anonymousDb.collection('config').get()
    );
  });

  await test('Anonymous read on /admins → PERMISSION_DENIED', async () => {
    await assertFails(
      anonymousDb.collection('admins').get()
    );
  });

  // Authenticated non-admin context
  const authDb = testEnv.authenticatedContext('user-not-admin').firestore();

  await test('Authenticated non-admin read on /admins → success', async () => {
    await assertSucceeds(
      authDb.collection('admins').get()
    );
  });

  await test('Authenticated non-admin write on /loads → PERMISSION_DENIED', async () => {
    await assertFails(
      authDb.collection('loads').add({ test: true })
    );
  });

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  await testEnv.cleanup();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test setup failed:', err.message);
  if (err.message.includes('ECONNREFUSED') || err.message.includes('connect')) {
    console.error('\n⚠️  Could not connect to Firestore emulator at 127.0.0.1:8080');
    console.error('   Start it with: firebase emulators:start --only firestore');
  }
  process.exit(1);
});

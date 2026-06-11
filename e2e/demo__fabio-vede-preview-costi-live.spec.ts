import { expect, test } from '@playwright/test';
import { doc, setDoc } from 'firebase/firestore';
import {
  clearAuthEmulatorUsers,
  createAuthEmulatorUser,
  seedAuthStateInBrowser,
} from './helpers/auth-seed';
import {
  createSeedEnvironment,
  seedCanonicalDashboardData,
  seedConfigPrices,
  type SeedEnvironment,
} from './helpers/firestore-seed';

test.use({ video: 'on' });

test.describe('US-009 demo — Fabio vede la preview costi live', () => {
  let firestoreEnv: SeedEnvironment;

  test.beforeAll(async () => {
    firestoreEnv = await createSeedEnvironment();
  });

  test.beforeEach(async ({ page }) => {
    await seedCanonicalDashboardData(firestoreEnv);
    await seedConfigPrices(firestoreEnv, { waterPrice: 35, energyPrice: 10 });

    const adminUser = await createAuthEmulatorUser('demo-us009@test.com', 'password123');
    await seedAdmin(firestoreEnv, adminUser.uid);
    await seedAuthStateInBrowser(page, 'demo-us009@test.com', 'password123');
  });

  test.afterEach(async () => {
    await clearAuthEmulatorUsers();
  });

  test.afterAll(async () => {
    await firestoreEnv.cleanup();
  });

  test('Fabio cambia un peso e vede la preview aggiornarsi senza salvare', async ({ page }) => {
    await page.goto('/admin/carichi/nuovo');

    await expect(page.getByRole('heading', { name: 'Registra carico' })).toBeVisible();
    const preview = page.locator('#preview-card');
    await expect(preview).toContainText('Anteprima costi');

    const fabioCost = page.locator('.preview-breakdown-row', { hasText: 'Fabio' }).locator('.preview-cost');
    await expect(fabioCost).toContainText('€11.25');

    await page.getByLabel('Peso Fabio').fill('2');
    await expect(fabioCost).toContainText('€18.00');
    await expect(page.locator('.preview-check')).toContainText('Totale anteprima €45.00');

    await page.waitForTimeout(1_500);
  });
});

async function seedAdmin(testEnv: SeedEnvironment, uid: string): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'admins', uid), { uid });
  });
}

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

test.describe('US-009 — Preview costi form carico', () => {
  let firestoreEnv: SeedEnvironment;

  test.beforeAll(async () => {
    firestoreEnv = await createSeedEnvironment();
  });

  test.beforeEach(async ({ page }) => {
    await seedCanonicalDashboardData(firestoreEnv);
    await seedConfigPrices(firestoreEnv, { waterPrice: 35, energyPrice: 10 });

    const adminUser = await createAuthEmulatorUser('admin-us009@test.com', 'password123');
    await seedAdmin(firestoreEnv, adminUser.uid);
    await seedAuthStateInBrowser(page, 'admin-us009@test.com', 'password123');
  });

  test.afterEach(async () => {
    await clearAuthEmulatorUsers();
  });

  test.afterAll(async () => {
    await firestoreEnv.cleanup();
  });

  test('aggiorna immediatamente la quota persona quando cambia un peso', async ({ page }) => {
    await page.goto('/admin/carichi/nuovo');

    await expect(page).toHaveURL(/\/admin\/carichi\/nuovo/);
    const fabioCost = page.locator('.preview-breakdown-row', { hasText: 'Fabio' }).locator('.preview-cost');
    await expect(fabioCost).toContainText('€11.25');

    await page.getByLabel('Peso Fabio').fill('2');

    await expect(fabioCost).toContainText('€18.00');
    await expect(page.locator('.preview-check')).toContainText('Totale anteprima €45.00');
  });

  test('aggiorna quote e quadratura quando cambiano i prezzi', async ({ page }) => {
    await page.goto('/admin/carichi/nuovo');

    await page.getByLabel('Prezzo acqua in euro').fill('45');
    await page.getByLabel('Prezzo energia in euro').fill('15');

    await expect(page.locator('.preview-total-amount')).toContainText('€60.00');
    await expect(page.locator('.preview-check')).toContainText('Atteso €60.00');
    await expect(page.locator('.preview-check')).toContainText('Totale anteprima €60.00');
    await expect(page.locator('.preview-breakdown-row', { hasText: 'Fabio' }).locator('.preview-cost')).toContainText('€15.00');
  });

  test('mostra avviso e disabilita il salvataggio con somma pesi zero', async ({ page }) => {
    await page.goto('/admin/carichi/nuovo');

    for (const name of ['Fabio', 'Fernando', 'Nino', 'Daniele']) {
      await page.getByLabel(`Peso ${name}`).fill('0');
    }

    await expect(page.locator('.preview-warning')).toContainText('La somma dei pesi è 0');
    await expect(page.locator('.preview-check')).toContainText('Totale non calcolabile');
    await expect(page.getByRole('button', { name: 'Salva carico' })).toBeDisabled();
  });
});

async function seedAdmin(testEnv: SeedEnvironment, uid: string): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'admins', uid), { uid });
  });
}

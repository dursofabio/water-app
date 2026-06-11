import { expect, test } from '@playwright/test';
import {
  createSeedEnvironment,
  seedCanonicalDashboardData,
  seedConfigPrices,
  type SeedEnvironment,
} from './helpers/firestore-seed';

/**
 * US-008 — Test E2E validazione e protezione rotta form carico
 *
 * Verifica i comportamenti chiave dell'authGuard sulla rotta del form:
 * - /admin/carichi/nuovo redirige a /login per utenti non autenticati
 * - /admin redirige a /login per utenti non autenticati
 *
 * La validazione del form (pesi a 0, data obbligatoria, override prezzi)
 * è coperta dai test unitari in load-form.spec.ts.
 */

test.describe('US-008 — Protezione rotta form carico', () => {
  let firestoreEnv: SeedEnvironment;

  test.beforeAll(async () => {
    firestoreEnv = await createSeedEnvironment();
  });

  test.beforeEach(async () => {
    await seedCanonicalDashboardData(firestoreEnv);
    await seedConfigPrices(firestoreEnv);
  });

  test.afterAll(async () => {
    await firestoreEnv.cleanup();
  });

  test('rotta /admin/carichi/nuovo è protetta da authGuard', async ({ page }) => {
    await page.goto('/admin/carichi/nuovo');
    await expect(page).toHaveURL(/\/login/);
  });

  test('rotta /admin è protetta da authGuard', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('la dashboard pubblica è raggiungibile senza autenticazione', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    // Verifica che la pagina carichi abbia caricato
    await expect(page.locator('app-root')).toBeVisible();
  });
});

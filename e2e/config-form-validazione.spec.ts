import { expect, test } from '@playwright/test';
import {
  createSeedEnvironment,
  seedCanonicalDashboardData,
  seedConfigPrices,
  type SeedEnvironment,
} from './helpers/firestore-seed';

/**
 * US-013 — Test E2E protezione rotta e validazione form configurazione prezzi
 *
 * Verifica i comportamenti chiave:
 * - /admin/configurazione redirige a /login per utenti non autenticati
 * - La dashboard pubblica è accessibile (smoke test)
 *
 * La logica di validazione (prezzi negativi, NaN, etc.) e la logica del form
 * sono coperte dai unit test in config-form.spec.ts.
 */

test.describe('US-013 — Protezione rotta form configurazione prezzi', () => {
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

  test('rotta /admin/configurazione è protetta da authGuard', async ({ page }) => {
    await page.goto('/admin/configurazione');
    await expect(page).toHaveURL(/\/login/);
  });

  test('rotta /admin è protetta da authGuard', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('la dashboard pubblica è raggiungibile senza autenticazione', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('il gate di login mostra il titolo corretto', async ({ page }) => {
    await page.goto('/admin/configurazione');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');
  });
});

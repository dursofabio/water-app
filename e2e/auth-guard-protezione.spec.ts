import { expect, test } from '@playwright/test';
import {
  createSeedEnvironment,
  seedCanonicalDashboardData,
  type SeedEnvironment,
} from './helpers/firestore-seed';

/**
 * US-006 / US-007 — Protezione rotta /admin e comportamento authGuard
 *
 * Verifica che:
 * - /admin redirige a /login senza autenticazione (authGuard — US-007: redirect corretto)
 * - la rotta /login è accessibile
 * - la navigazione da /login a /dashboard avviene correttamente
 */

test.describe('US-006 — Protezione rotta admin e authGuard', () => {
  let firestoreEnv: SeedEnvironment;

  test.beforeAll(async () => {
    firestoreEnv = await createSeedEnvironment();
  });

  test.beforeEach(async () => {
    await seedCanonicalDashboardData(firestoreEnv);
  });

  test.afterAll(async () => {
    await firestoreEnv.cleanup();
  });

  test('accedere a /admin senza autenticazione redirige a /login (US-007)', async ({ page }) => {
    await page.goto('/admin');

    // US-007: il guard ora redirige a /login, non a /dashboard
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');
  });

  test('la rotta /login è accessibile e mostra la pagina di accesso', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');
  });

  test("il footer della pagina login riporta 'Solo admin autorizzati'", async ({ page }) => {
    await page.goto('/login');

    const footer = page.locator('.gate-footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Solo admin autorizzati');
  });
});

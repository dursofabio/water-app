import { expect, test } from '@playwright/test';
import {
  createSeedEnvironment,
  seedCanonicalDashboardData,
  type SeedEnvironment,
} from './helpers/firestore-seed';

/**
 * US-006 — Login non autorizzato e messaggio negato
 *
 * Verifica che:
 * - La dashboard mostri il banner "Accesso negato" quando il query param denied=true è presente
 * - Il banner sia accessibile (role=alert)
 * - La dashboard non mostri il banner in assenza del query param
 */

test.describe('US-006 — Login non autorizzato', () => {
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

  test('mostra il banner "Accesso negato" quando denied=true è nel query param', async ({ page }) => {
    await page.goto('/dashboard?denied=true');

    const banner = page.locator('[role="alert"].access-denied-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Accesso negato');
    await expect(banner).toContainText('non è autorizzato come amministratore');
  });

  test('non mostra il banner in assenza del query param denied', async ({ page }) => {
    await page.goto('/dashboard');

    const banner = page.locator('.access-denied-banner');
    await expect(banner).not.toBeVisible();
  });

  test('il pulsante "Accedi con Google" è presente e cliccabile nella pagina login', async ({ page }) => {
    await page.goto('/login');

    const btn = page.locator('.btn-google');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
    await expect(btn).toContainText('Accedi con Google');
  });
});

import { expect, test } from '@playwright/test';
import {
  createSeedEnvironment,
  seedCanonicalDashboardData,
  type SeedEnvironment,
} from './helpers/firestore-seed';

/**
 * US-012 Demo — Cancellazione pagamento
 *
 * Demonstrates: Fabio opens the payments list, clicks delete on a payment,
 * confirms the dialog — payment disappears and dashboard updates.
 *
 * Note: full authenticated flow not reproducible with OAuth emulator.
 * This suite verifies auth guard + route protection:
 * - La rotta /admin/pagamenti è protetta da authGuard (redirige a /login)
 * - La rotta /admin/pagamenti/:id è protetta da authGuard (redirige a /login)
 *
 * No demo video: rotta admin protetta da auth — il flusso Fabio-cancella-pagamento
 * non è riproducibile con l'emulatore OAuth senza bypass manuale.
 */

test.describe('US-012 — Lista e gestione pagamenti admin', () => {
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

  test('la rotta /admin/pagamenti è protetta da authGuard', async ({ page }) => {
    await page.goto('/admin/pagamenti');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');

    await page.waitForTimeout(1_500);
  });

  test('la rotta /admin/pagamenti/:id è protetta da authGuard', async ({ page }) => {
    await page.goto('/admin/pagamenti/test-payment-id');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');

    await page.waitForTimeout(1_500);
  });
});

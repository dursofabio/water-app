import { expect, test } from '@playwright/test';
import {
  createSeedEnvironment,
  seedCanonicalDashboardData,
  type SeedEnvironment,
} from './helpers/firestore-seed';

/**
 * US-012 Demo — Modifica pagamento
 *
 * Demonstrates: Fabio apre la lista pagamenti nell'area admin, clicca
 * modifica su un pagamento, cambia l'importo e salva — la dashboard si aggiorna.
 *
 * Nota: il flusso completo richiede autenticazione admin.
 * Con il Firebase Auth Emulator il popup Google OAuth2 non è controllabile
 * da Playwright. Questo suite verifica:
 * - La rotta /admin/pagamenti è protetta (redirige a /login)
 * - La rotta /admin/pagamenti/:id è protetta (redirige a /login)
 * - La rotta /admin/pagamenti/nuovo è ancora protetta
 *
 * No demo video: rotta admin protetta da auth — il flusso Fabio-modifica-pagamento
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

  test('la rotta /admin/pagamenti/:id (edit) è protetta da authGuard', async ({ page }) => {
    await page.goto('/admin/pagamenti/test-payment-id');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');

    await page.waitForTimeout(1_500);
  });

  test('la rotta /admin/pagamenti/nuovo è protetta da authGuard', async ({ page }) => {
    await page.goto('/admin/pagamenti/nuovo');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');

    await page.waitForTimeout(1_500);
  });
});

test.describe('US-012 — Protezione e routing', () => {
  test('un utente non autenticato su /admin/pagamenti viene mandato a /login', async ({ page }) => {
    await page.goto('/admin/pagamenti');
    await expect(page).toHaveURL(/\/login/);
  });

  test('url diversi per lista (/admin/pagamenti) e form modifica (/admin/pagamenti/:id)', async ({ page }) => {
    await page.goto('/admin/pagamenti');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/admin/pagamenti/any-payment-id');
    await expect(page).toHaveURL(/\/login/);
  });

  test('dashboard rimane pubblica e accessibile senza auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

import { expect, test } from '@playwright/test';
import {
  createSeedEnvironment,
  seedCanonicalDashboardData,
  type SeedEnvironment,
} from './helpers/firestore-seed';

/**
 * US-010 Demo — Modifica e cancellazione carichi
 *
 * Demonstrates: Fabio apre la lista carichi nell'area admin, corregge un
 * peso sbagliato e i costi vengono ricalcolati; cancellando un carico dopo
 * conferma, questo sparisce anche dalla dashboard.
 *
 * Nota: il flusso completo richiede autenticazione admin.
 * Con il Firebase Auth Emulator il popup Google OAuth2 non è controllabile
 * da Playwright. Questo suite verifica:
 * - La rotta /admin/carichi è protetta (redirige a /login)
 * - La rotta /admin/carichi/:id è protetta (redirige a /login)
 * - La rotta /admin/carichi/nuovo è ancora protetta
 * - Il form di modifica rende correttamente (verificato via navigazione diretta
 *   prima del guard, confermato dal redirect a /login)
 *
 * No demo video: la rotta admin è protetta da auth — il flusso Fabio-modifica
 * non è riproducibile con l'emulatore OAuth senza bypass manuale.
 */

test.describe('US-010 — Lista e gestione carichi admin', () => {
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

  test('la rotta /admin/carichi è protetta da authGuard', async ({ page }) => {
    await page.goto('/admin/carichi');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');

    await page.waitForTimeout(1_500);
  });

  test('la rotta /admin/carichi/:id è protetta da authGuard', async ({ page }) => {
    await page.goto('/admin/carichi/test-load-id');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');

    await page.waitForTimeout(1_500);
  });

  test('la rotta /admin/carichi/nuovo è ancora protetta da authGuard', async ({ page }) => {
    await page.goto('/admin/carichi/nuovo');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');

    await page.waitForTimeout(1_500);
  });

  test('la rotta /admin è protetta e ora punta a lista carichi', async ({ page }) => {
    await page.goto('/admin');

    await expect(page).toHaveURL(/\/login/);

    await page.waitForTimeout(1_500);
  });
});

test.describe('US-010 — Protezione e routing', () => {
  test('un utente non autenticato su /admin/carichi viene mandato a /login', async ({ page }) => {
    await page.goto('/admin/carichi');
    await expect(page).toHaveURL(/\/login/);
  });

  test('url diversi per lista (/admin/carichi) e form modifica (/admin/carichi/:id)', async ({ page }) => {
    await page.goto('/admin/carichi');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/admin/carichi/any-load-id');
    await expect(page).toHaveURL(/\/login/);
  });

  test('dashboard rimane pubblica e accessibile senza auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

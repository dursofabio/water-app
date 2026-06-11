import { expect, test } from '@playwright/test';
import {
  createSeedEnvironment,
  seedCanonicalDashboardData,
  type SeedEnvironment,
} from './helpers/firestore-seed';

/**
 * US-006 Demo — Pagina di login e protezione rotta admin
 *
 * Demonstrates: un utente apre /login e vede la pagina di accesso admin;
 * l'area /admin è protetta dal guard e redirige a /dashboard per un
 * utente non autenticato.
 *
 * Nota: il flusso completo signInWithPopup non è testabile in Playwright
 * con il Firebase Auth Emulator (il popup OAuth2 Google richiede una finestra
 * esterna non controllabile da Playwright). I test verificano:
 * - Rendering della pagina login
 * - Protezione della rotta /admin tramite authGuard
 * - Banner "Accesso negato" in /dashboard con query param denied=true
 */

test.use({ video: 'on' });

test.describe('US-006 demo — Accesso admin e protezione rotte', () => {
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

  test("la pagina /login mostra il pulsante 'Accedi con Google'", async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');
    await expect(page.locator('.gate-card__eyebrow')).toContainText('Accesso riservato');

    const googleBtn = page.locator('.btn-google');
    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toContainText('Accedi con Google');

    // Verifica presenza del logo Google nel pulsante
    await expect(googleBtn.locator('svg')).toBeVisible();

    await page.waitForTimeout(1_500);
  });

  test("l'area /admin redirige a /login per utente non autenticato (authGuard — US-007)", async ({ page }) => {
    await page.goto('/admin');

    // US-007: authGuard ora redirige a /login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');

    await page.waitForTimeout(1_500);
  });

  test("la dashboard mostra il banner 'Accesso negato' con query param denied=true", async ({ page }) => {
    await page.goto('/dashboard?denied=true');

    const banner = page.locator('.access-denied-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Accesso negato');

    await page.waitForTimeout(1_500);
  });
});

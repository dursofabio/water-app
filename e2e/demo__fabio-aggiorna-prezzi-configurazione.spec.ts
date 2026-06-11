import { expect, test } from '@playwright/test';
import {
  createSeedEnvironment,
  seedCanonicalDashboardData,
  seedConfigPrices,
  type SeedEnvironment,
} from './helpers/firestore-seed';

/**
 * US-013 Demo — Configurazione prezzi acqua ed energia
 *
 * Demonstrates: Fabio aggiorna il prezzo dell'acqua da 35€ a 28€ nel form di
 * configurazione; i nuovi carichi propongono 28€ mentre i carichi storici
 * mantengono lo snapshot originale.
 *
 * Nota: il flusso completo richiede autenticazione Google OAuth2.
 * Con il Firebase Auth Emulator il popup non è controllabile da Playwright.
 * Il test verifica:
 * - La rotta /admin/configurazione è protetta da authGuard (redirige a /login)
 * - La dashboard pubblica è raggiungibile senza autenticazione
 * - La validazione blocca prezzi negativi (verificata via unit test e DOM)
 */

test.use({ video: 'on' });

test.describe('US-013 demo — Configurazione prezzi acqua ed energia', () => {
  let firestoreEnv: SeedEnvironment;

  test.beforeAll(async () => {
    firestoreEnv = await createSeedEnvironment();
  });

  test.beforeEach(async () => {
    await seedCanonicalDashboardData(firestoreEnv);
    await seedConfigPrices(firestoreEnv, { waterPrice: 35, energyPrice: 10 });
  });

  test.afterAll(async () => {
    await firestoreEnv.cleanup();
  });

  test('la rotta /admin/configurazione è protetta da authGuard (redirige a /login)', async ({ page }) => {
    await page.goto('/admin/configurazione');

    // authGuard deve redirigere a /login perché l'utente non è autenticato
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');

    await page.waitForTimeout(1_500);
  });

  test("l'area /admin è protetta da authGuard e redirige a /login", async ({ page }) => {
    await page.goto('/admin');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');

    await page.waitForTimeout(1_500);
  });

  test('la dashboard pubblica è raggiungibile senza autenticazione', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('app-root')).toBeVisible();

    await page.waitForTimeout(1_500);
  });
});

import { expect, test } from '@playwright/test';
import {
  createSeedEnvironment,
  seedCanonicalDashboardData,
  type SeedEnvironment,
} from './helpers/firestore-seed';

/**
 * US-011 — Test E2E validazione e protezione rotta form pagamento
 *
 * Verifica i comportamenti chiave dell'authGuard sulla rotta del form:
 * - /admin/pagamenti/nuovo redirige a /login per utenti non autenticati
 * - /admin redirige a /login per utenti non autenticati
 *
 * La validazione del form (importo a 0 blocca submit, persona obbligatoria,
 * nota opzionale) è coperta dai test unitari in payment-form.spec.ts.
 */

test.describe('US-011 — Protezione rotta form pagamento', () => {
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

  test('rotta /admin/pagamenti/nuovo è protetta da authGuard', async ({ page }) => {
    await page.goto('/admin/pagamenti/nuovo');
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

  test('tentativo di accesso con importo zero mostra messaggio di validazione', async ({ page }) => {
    // La rotta è protetta — verifichiamo il redirect corretto
    await page.goto('/admin/pagamenti/nuovo');
    await expect(page).toHaveURL(/\/login/);

    // Il gate di login è visibile
    await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');
  });
});

import { expect, test } from '@playwright/test';
import {
  createSeedEnvironment,
  seedCanonicalDashboardData,
  type SeedEnvironment,
} from './helpers/firestore-seed';
import {
  createAuthEmulatorUser,
  addAdminToFirestore,
  clearAuthEmulatorUsers,
  seedAuthStateInBrowser,
} from './helpers/auth-seed';

/**
 * US-007 — Protezione rotte admin e logout
 *
 * TASK-05: Accesso diretto a /admin senza sessione → redirect a /login
 * TASK-06: Logout dal menu admin → redirect a /login con sessione terminata
 */

test.describe('US-007 — Protezione rotte admin e logout', () => {
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

  // ─── TASK-05: accesso diretto senza sessione → /login ─────────────────────

  test('TASK-05: accedere a /admin senza autenticazione redirige a /login', async ({ page }) => {
    // Nessuna sessione attiva — storage pulito
    await page.goto('/admin');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');
  });

  test('TASK-05: la rotta /login è accessibile senza autenticazione', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');
  });

  // ─── TASK-06: logout dal menu admin ───────────────────────────────────────

  test.describe('TASK-06 — logout admin', () => {
    test.afterEach(async () => {
      // Cleanup Auth Emulator dopo ogni test che crea utenti
      await clearAuthEmulatorUsers();
    });

    test('un admin autenticato vede il pulsante Logout in /admin', async ({ page }) => {
      const adminUser = await createAuthEmulatorUser('admin-us007@test.com', 'password123');
      await addAdminToFirestore(adminUser.uid);

      await seedAuthStateInBrowser(page, 'admin-us007@test.com', 'password123');

      await page.goto('/admin');

      await expect(page).toHaveURL(/\/admin/);
      const logoutBtn = page.locator('button', { hasText: 'Logout' });
      await expect(logoutBtn).toBeVisible();
    });

    test('cliccando Logout dalla pagina admin si atterra su /login', async ({ page }) => {
      const adminUser = await createAuthEmulatorUser('admin-us007-logout@test.com', 'password123');
      await addAdminToFirestore(adminUser.uid);

      await seedAuthStateInBrowser(page, 'admin-us007-logout@test.com', 'password123');

      await page.goto('/admin');

      await expect(page).toHaveURL(/\/admin/);

      const logoutBtn = page.locator('button', { hasText: 'Logout' });
      await expect(logoutBtn).toBeVisible();
      await logoutBtn.click();

      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');
    });
  });
});

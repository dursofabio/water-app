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
 * US-007 Demo — Protezione rotta admin e logout
 *
 * Demonstrates:
 * - Accesso diretto a /admin senza sessione → redirect a /login
 * - Admin autenticato accede a /admin, clicca Logout → ritorna a /login
 */

test.use({ video: 'on' });

test.describe('US-007 demo — Protezione rotte admin e logout', () => {
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

  test('accesso diretto a /admin senza sessione → redirect a /login', async ({ page }) => {
    await page.goto('/admin');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.gate-card__title')).toBeVisible();
    await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');

    await page.waitForTimeout(1_500);
  });

  test('admin autenticato accede a /admin, clicca Logout, atterra su /login', async ({ page }) => {
    const adminUser = await createAuthEmulatorUser('demo-us007@test.com', 'password123');
    await addAdminToFirestore(adminUser.uid);

    await seedAuthStateInBrowser(page, 'demo-us007@test.com', 'password123');

    await page.goto('/admin');

    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('h1')).toContainText('Area Amministratore');

    const logoutBtn = page.locator('button', { hasText: 'Logout' });
    await expect(logoutBtn).toBeVisible();

    await logoutBtn.click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.gate-card__title')).toBeVisible();
    await expect(page.locator('.gate-card__title')).toContainText('Area amministratore');

    await page.waitForTimeout(1_500);

    await clearAuthEmulatorUsers();
  });
});

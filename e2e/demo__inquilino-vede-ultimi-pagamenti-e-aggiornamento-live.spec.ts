import { expect, test } from '@playwright/test';

import {
  createSeedEnvironment,
  insertRealtimePayment,
  seedCanonicalDashboardData,
  type SeedEnvironment,
} from './helpers/firestore-seed';

test.use({ video: 'on' });

test.describe('US-005 demo', () => {
  let testEnv: SeedEnvironment;

  test.beforeAll(async () => {
    testEnv = await createSeedEnvironment();
  });

  test.beforeEach(async () => {
    await seedCanonicalDashboardData(testEnv);
  });

  test.afterAll(async () => {
    await testEnv.cleanup();
  });

  test("l'inquilino vede gli ultimi pagamenti e riceve aggiornamenti realtime", async ({ page }) => {
    await page.goto('/');

    const payments = page.getByRole('list', { name: /ultimi pagamenti/i });
    await expect(payments).toBeVisible();

    const rows = payments.getByRole('listitem');
    await expect(rows).toHaveCount(10);
    await expect(rows.first()).toContainText('10 giu');
    await expect(rows.first()).toContainText('Fernando');
    await expect(rows.first()).toContainText('100,00');
    await expect(rows.first()).toContainText('Bonifico istantaneo');

    await insertRealtimePayment(testEnv);

    await expect(rows).toHaveCount(10);
    await expect(rows.first()).toContainText('11 giu');
    await expect(rows.first()).toContainText('Daniele');
    await expect(rows.first()).toContainText('55,00');
    await expect(rows.first()).toContainText('Pagamento appena registrato');

    await page.waitForTimeout(1_500);
  });
});

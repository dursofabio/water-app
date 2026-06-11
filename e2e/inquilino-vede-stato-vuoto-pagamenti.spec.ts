import { expect, test } from '@playwright/test';

import {
  createSeedEnvironment,
  seedCanonicalDashboardData,
  type SeedEnvironment,
} from './helpers/firestore-seed';

test.describe('US-005 stato vuoto', () => {
  let testEnv: SeedEnvironment;

  test.beforeAll(async () => {
    testEnv = await createSeedEnvironment();
  });

  test.beforeEach(async () => {
    await seedCanonicalDashboardData(testEnv, { includePayments: false });
  });

  test.afterAll(async () => {
    await testEnv.cleanup();
  });

  test("l'inquilino vede uno stato vuoto leggibile quando non ci sono pagamenti", async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Ultimi pagamenti' })).toBeVisible();
    await expect(page.getByText('Nessun pagamento registrato.')).toBeVisible();
    await expect(page.getByText(/comparirà qui con data, persona, importo e nota/i)).toBeVisible();
  });
});

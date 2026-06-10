import { expect, test } from '@playwright/test';

import {
  createSeedEnvironment,
  insertRealtimeLoad,
  seedCanonicalDashboardData,
  type SeedEnvironment,
} from './helpers/firestore-seed';

test.use({ video: 'on' });

test.describe('US-004 demo', () => {
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

  test("l'inquilino vede gli ultimi carichi, espande il dettaglio e riceve aggiornamenti realtime", async ({ page }) => {
    await page.goto('/');

    const loads = page.getByRole('list', { name: /ultimi carichi/i });
    await expect(loads).toBeVisible();

    const rows = loads.getByRole('listitem');
    await expect(rows).toHaveCount(3);
    await expect(rows.first().getByRole('button')).toContainText('09 giu');
    await expect(rows.first().getByRole('button')).toContainText('Pagato da Fabio');
    await expect(rows.first().getByRole('button')).toContainText('120,00');

    const firstLoad = rows.first().getByRole('button');
    await firstLoad.click();
    const firstLoadDetail = rows.first().locator('.load-detail');
    await expect(firstLoad).toHaveAttribute('aria-expanded', 'true');
    await expect(firstLoadDetail.getByText('Acqua 100,00')).toBeVisible();
    await expect(firstLoadDetail.getByText('Energia 20,00')).toBeVisible();
    await expect(firstLoadDetail.getByText('Totale pesi 12')).toBeVisible();
    const fernandoDetail = firstLoadDetail.locator('.detail-item').filter({ hasText: 'Fernando' });
    await expect(fernandoDetail).toBeVisible();
    await expect(fernandoDetail.getByText('Peso 2', { exact: true })).toBeVisible();
    await expect(fernandoDetail.getByText('20,00')).toBeVisible();

    await insertRealtimeLoad(testEnv);

    await expect(rows).toHaveCount(4);
    await expect(rows.first().getByRole('button')).toContainText('11 giu');
    await expect(rows.first().getByRole('button')).toContainText('Pagato da Daniele');
    await expect(rows.first().getByRole('button')).toContainText('90,00');

    await page.waitForTimeout(1_500);
  });
});

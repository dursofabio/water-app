import { expect, test } from '@playwright/test';

import {
  createSeedEnvironment,
  seedCanonicalDashboardData,
  type SeedEnvironment,
} from './helpers/firestore-seed';

test.use({
  video: 'on',
  viewport: { width: 390, height: 844 },
  launchOptions: {
    slowMo: 300,
  },
});

test.describe('US-020 demo — dashboard pubblica orientata al saldo', () => {
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

  test('saldo personale e stato complessivo sono chiari above the fold', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Chi deve cosa, senza chiedere a Fabio.' })).toBeVisible();
    await expect(page.getByLabel('Dati aggiornati in tempo reale')).toContainText('Aggiornato');

    const summaryCards = page.getByRole('list', { name: 'Saldi immediati per persona' });
    await expect(summaryCards).toBeVisible();

    const cards = summaryCards.getByRole('listitem');
    await expect(cards).toHaveCount(4);
    await expect(page.getByRole('region', { name: 'Saldo di Fernando' })).toContainText('Fernando');
    await expect(page.getByRole('region', { name: 'Saldo di Nino' })).toContainText('Nino');
    await expect(page.getByRole('region', { name: 'Saldo di Daniele' })).toContainText('Daniele');
    await expect(page.getByRole('region', { name: 'Saldo di Fabio' })).toContainText('Fabio');

    await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasHorizontalOverflow).toBe(false);

    const ninoCard = page.getByRole('region', { name: 'Saldo di Nino' });
    const ninoFront = ninoCard.getByRole('button', { name: /Nino/ });
    await ninoFront.click();

    await expect(ninoFront).toHaveAttribute('aria-expanded', 'true');
    await expect(ninoCard.locator('.balance-card__back')).toHaveAttribute('aria-hidden', 'false');
    await expect(ninoCard.locator('dl')).toContainText('Carichi');
    await expect(ninoCard.locator('dl')).toContainText('Pagamenti');
    await expect(ninoCard.locator('dl')).toContainText('Saldo');

    await ninoCard.getByRole('button', { name: 'Torna al saldo' }).click();
    await expect(ninoFront).toHaveAttribute('aria-expanded', 'false');

    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(summaryCards).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ultimi carichi' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ultimi pagamenti' })).toBeVisible();

    const cardBottoms = await cards.evaluateAll((items) =>
      items.map((item) => item.getBoundingClientRect().bottom),
    );
    expect(Math.max(...cardBottoms)).toBeLessThanOrEqual(720);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ninoFront.click();
    await expect(ninoCard.locator('.balance-card__back')).toHaveAttribute('aria-hidden', 'false');
    await expect(ninoCard.locator('dl')).toContainText('Saldo');

    await page.waitForTimeout(1_500);
  });
});

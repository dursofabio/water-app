import { expect, test } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

test.use({
  video: 'on',
  viewport: { width: 1280, height: 720 },
  launchOptions: {
    slowMo: 300,
  },
});

test.describe('US-019 demo — mockup card utente fronte/retro', () => {
  test('mostra tutte le card saldo e rivela il calcolo con flip accessibile', async ({ page }) => {
    const mockupUrl = pathToFileURL(path.resolve('docs/mockups/US-019/index.html')).toString();

    await page.goto(mockupUrl);

    await expect(page.getByRole('heading', { name: 'Chi deve cosa, senza chiedere a Fabio.' })).toBeVisible();
    await expect(page.getByLabel('Dati aggiornati in tempo reale')).toContainText('11 giu 2026, 18:42');

    const cards = page.locator('.balance-card');
    await expect(cards).toHaveCount(4);

    await expect(page.locator('[data-person="fernando"] .balance-card__front')).toContainText('-€25,00');
    await expect(page.locator('[data-person="nino"] .balance-card__front')).toContainText('+€30,00');
    await expect(page.locator('[data-person="daniele"] .balance-card__front')).toContainText('+€25,00');
    await expect(page.locator('[data-person="fabio"] .balance-card__front')).toContainText('€0,00');

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('[data-person="fernando"] .balance-card__front')).toBeVisible();
    await expect(page.locator('[data-person="nino"] .balance-card__front')).toBeVisible();

    const ninoCard = page.locator('[data-person="nino"]');
    const ninoFront = ninoCard.locator('.balance-card__front');
    const ninoBack = ninoCard.locator('.balance-card__back');

    await ninoFront.click();
    await expect(ninoFront).toHaveAttribute('aria-expanded', 'true');
    await expect(ninoBack).toHaveAttribute('aria-hidden', 'false');
    await expect(ninoBack.getByRole('heading', { name: 'Nino' })).toBeVisible();
    await expect(ninoBack).toContainText('Carichi');
    await expect(ninoBack).toContainText('€60,00');
    await expect(ninoBack).toContainText('Pagamenti');
    await expect(ninoBack).toContainText('€30,00 da versare');

    await ninoCard.getByRole('button', { name: 'Torna al saldo' }).click();
    await expect(ninoFront).toHaveAttribute('aria-expanded', 'false');
    await expect(ninoBack).toHaveAttribute('aria-hidden', 'true');
    await expect(ninoFront).toBeFocused();

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ninoFront.click();
    await expect(ninoBack).toBeVisible();
    await expect(ninoBack).toContainText('€30,00 da versare');

    await page.waitForTimeout(1_500);
  });
});

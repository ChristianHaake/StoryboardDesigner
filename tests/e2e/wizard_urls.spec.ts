import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function reachEditor(page: Page) {
  await page.goto('/');
  await page.locator('button', { hasText: 'Kurzfilm' }).first().click();
  await page.locator('#projectName').fill('URL Test');
  await page.locator('button', { hasText: 'Zum Editor' }).click();
}

test.describe('Wizard steps in the URL', () => {
  test('every step has its own path', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await page.locator('button', { hasText: 'Kurzfilm' }).first().click();
    await expect(page).toHaveURL(/\/setup$/);
    await page.locator('#projectName').fill('URL Test');
    await page.locator('button', { hasText: 'Zum Editor' }).click();
    await expect(page).toHaveURL(/\/editor$/);
    await page.locator('button', { hasText: 'Szene hinzufügen' }).click();
    await page.locator('button', { hasText: 'Prüfen & Abschließen' }).click();
    await expect(page).toHaveURL(/\/review$/);
    await page.locator('button', { hasText: 'Weiter zum Export' }).click();
    await expect(page).toHaveURL(/\/export$/);
  });

  test('browser back and forward move one step', async ({ page }) => {
    await reachEditor(page);
    await page.locator('button', { hasText: 'Szene hinzufügen' }).click();
    await page.locator('button', { hasText: 'Prüfen & Abschließen' }).click();
    await expect(page.locator('h1')).toHaveText('Projekt prüfen');

    await page.goBack();
    await expect(page).toHaveURL(/\/editor$/);
    await expect(page.locator('h1', { hasText: 'URL Test' })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/setup$/);
    await expect(page.locator('#projectName')).toHaveValue('URL Test');

    await page.goForward();
    await page.goForward();
    await expect(page).toHaveURL(/\/review$/);
    await expect(page.locator('h1')).toHaveText('Projekt prüfen');
  });

  test('reload keeps the current step', async ({ page }) => {
    await reachEditor(page);
    await page.locator('button', { hasText: 'Szene hinzufügen' }).click();
    await page.locator('button', { hasText: 'Prüfen & Abschließen' }).click();
    await expect(page.getByText('Gespeichert')).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/review$/);
    await expect(page.locator('h1')).toHaveText('Projekt prüfen');
  });

  test('deep links without a project fall back to the start', async ({ page }) => {
    for (const path of ['/setup', '/editor', '/review', '/export']) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator('h1')).toContainText('Was möchtest du');
    }
  });

  test('content pages return to the step they were opened from', async ({ page }) => {
    await reachEditor(page);
    await page.getByRole('link', { name: 'Hilfe', exact: true }).click();
    await expect(page).toHaveURL(/\/hilfe$/);
    await page.getByRole('link', { name: /Zurück zum Editor/ }).click();
    await expect(page).toHaveURL(/\/editor$/);
    await expect(page.locator('h1', { hasText: 'URL Test' })).toBeVisible();

    await page.getByRole('link', { name: 'Hilfe', exact: true }).click();
    await page.goBack();
    await expect(page).toHaveURL(/\/editor$/);
    await expect(page.locator('h1', { hasText: 'URL Test' })).toBeVisible();
  });

  test('leaving the presentation returns to the previous step', async ({ page }) => {
    await reachEditor(page);
    await page.locator('button', { hasText: 'Szene hinzufügen' }).click();
    await page.getByRole('link', { name: 'Präsentieren' }).click();
    await expect(page).toHaveURL(/\/play$/);
    // Die Präsentation ist lazy geladen: erst auf ihre Bedienelemente warten.
    await expect(page.getByRole('button', { name: 'Abspielen' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/editor$/);
    await expect(page.locator('h1', { hasText: 'URL Test' })).toBeVisible();
  });
});

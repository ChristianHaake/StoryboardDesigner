import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function reachEditor(page: Page) {
  await page.goto('/');
  await page.locator('button', { hasText: 'Kurzfilm' }).first().click();
  await page.locator('#projectName').fill('A11y Test');
  await page.locator('button', { hasText: 'Zum Editor' }).click();
}

test.describe('Accessibility polish', () => {
  test('planning section is open on a new project', async ({ page }) => {
    await reachEditor(page);
    await expect(page.locator('#logline')).toBeVisible();
  });

  test('file menu is a disclosure: aria-expanded, Escape, focus return, outside click', async ({
    page,
  }) => {
    await reachEditor(page);
    const trigger = page.getByRole('button', { name: 'Datei', exact: true });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('button', { name: 'Speichern' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();

    await trigger.click();
    await page.locator('h1').click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // Tab führt direkt in die Einträge, Tab aus dem Menü schließt es.
    await trigger.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Laden' })).toBeFocused();
  });

  test('reset asks in an accessible dialog and keeps the project on cancel', async ({ page }) => {
    await reachEditor(page);
    await page.getByRole('button', { name: 'Datei', exact: true }).click();
    await page.getByRole('button', { name: 'Zurücksetzen' }).click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Abbrechen' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Datei', exact: true })).toBeFocused();
    await expect(page.locator('h1', { hasText: 'A11y Test' })).toBeVisible();

    await page.getByRole('button', { name: 'Datei', exact: true }).click();
    await page.getByRole('button', { name: 'Zurücksetzen' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Abbrechen' }).click();
    await expect(page.locator('h1', { hasText: 'A11y Test' })).toBeVisible();
  });

  test('skip link is the first tab stop and moves focus to the main content', async ({
    page,
    browserName,
  }) => {
    await page.goto('/');
    const skip = page.getByRole('link', { name: 'Zum Inhalt springen' });
    if (browserName === 'webkit') {
      // Safari fokussiert Links standardmäßig nicht per Tab (nur mit Option+Tab).
      await skip.focus();
    } else {
      await page.keyboard.press('Tab');
    }
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
    await expect(page).toHaveURL(/\/$/);
  });
});

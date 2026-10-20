import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function openExportWithScene(page: Page, action: string) {
  await page.goto('/');
  await page.locator('button', { hasText: 'Kurzfilm' }).first().click();
  await page.locator('#projectName').fill('Export Test');
  await page.locator('button', { hasText: 'Zum Editor' }).click();
  await page.locator('button', { hasText: 'Szene hinzufügen' }).click();
  if (action) await page.getByLabel('Handlung / Bildbeschreibung').fill(action);
  await page.locator('button', { hasText: 'Prüfen & Abschließen' }).click();
  await page.locator('button', { hasText: 'Weiter zum Export' }).click();
}

test.describe('Export step', () => {
  test('does not claim the storyboard is finished while a scene is empty', async ({ page }) => {
    await openExportWithScene(page, '');
    await expect(page.locator('h1')).toHaveText('Dein Storyboard exportieren');
    await expect(page.getByRole('note')).toContainText('Einige Szenen sind noch leer.');
  });

  test('says finished once no scene is empty', async ({ page }) => {
    await openExportWithScene(page, 'Auftritt der Hauptfigur');
    await expect(page.locator('h1')).toHaveText('Dein Storyboard ist fertig!');
    await expect(page.getByRole('note')).toHaveCount(0);
  });

  test('offers export actions once: cards instead of duplicate top-bar buttons', async ({
    page,
  }) => {
    await openExportWithScene(page, 'Auftritt der Hauptfigur');
    await expect(page.getByRole('button', { name: 'PDF', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Drucken', exact: true })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Als PDF herunterladen' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Präsentation starten' })).toBeVisible();
    // Undo/Redo und Datei-Menü bleiben erreichbar.
    await expect(page.getByRole('button', { name: 'Rückgängig' }).first()).toBeVisible();
  });
});

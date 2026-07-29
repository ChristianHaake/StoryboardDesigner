import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import fs from 'fs';

async function createBasicProject(page: Page, name = 'Release QA') {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Was möchtest du');
  await page.locator('button', { hasText: 'Kurzfilm' }).click();
  await page.locator('#projectName').fill(name);
  await page.locator('button', { hasText: 'Zum Editor' }).click();
  await page.locator('button', { hasText: 'Szene hinzufügen' }).click();
  await page.getByLabel('Handlung / Bildbeschreibung').fill('Release-QA Szenentext');
}

async function sceneActionValues(page: Page) {
  return page
    .getByLabel('Handlung / Bildbeschreibung')
    .evaluateAll((fields) => fields.map((field) => (field as HTMLTextAreaElement).value));
}

test.describe('Release QA regression smoke', () => {
  test('exports, imports, creates PDF, and calls print', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __printCalled: boolean }).__printCalled = false;
      window.print = () => {
        (window as unknown as { __printCalled: boolean }).__printCalled = true;
      };
    });

    await createBasicProject(page, 'Release QA Roundtrip');

    await page.locator('summary', { hasText: 'Datei' }).click();
    const projectDownloadPromise = page.waitForEvent('download');
    await page.locator('button', { hasText: 'Speichern' }).click();
    const projectDownload = await projectDownloadPromise;
    const projectPath = await projectDownload.path();
    expect(projectDownload.suggestedFilename()).toBe('Release QA Roundtrip.storyboard');
    expect(projectPath).toBeTruthy();
    expect(fs.statSync(projectPath!).size).toBeGreaterThan(100);

    const pdfDownloadPromise = page.waitForEvent('download');
    await page.locator('button', { hasText: /^PDF$/ }).click();
    const pdfDownload = await pdfDownloadPromise;
    const pdfPath = await pdfDownload.path();
    expect(pdfDownload.suggestedFilename()).toBe('Release QA Roundtrip.pdf');
    expect(pdfPath).toBeTruthy();
    expect(fs.statSync(pdfPath!).size).toBeGreaterThan(1000);

    await page.locator('button', { hasText: 'Drucken' }).click();
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __printCalled: boolean }).__printCalled))
      .toBe(true);

    await page.evaluate(() => {
      (window as unknown as { __printCalled: boolean }).__printCalled = false;
    });
    await page.locator('button', { hasText: 'Prüfen & Abschließen' }).click();
    await page.locator('button', { hasText: 'Weiter zum Export' }).click();
    await page
      .locator('main')
      .locator('div', { has: page.locator('h3', { hasText: 'Direkt drucken' }) })
      .locator('button', { hasText: 'Drucken' })
      .click();
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __printCalled: boolean }).__printCalled))
      .toBe(true);
    // Nach Druck/PDF kehrt die App automatisch zum Export-Schritt zurück.
    await expect(page.locator('h1', { hasText: 'Dein Storyboard ist fertig!' })).toBeVisible();

    const exportScreenPdfDownloadPromise = page.waitForEvent('download');
    await page.locator('button', { hasText: 'Als PDF herunterladen' }).click();
    const exportScreenPdfDownload = await exportScreenPdfDownloadPromise;
    expect(exportScreenPdfDownload.suggestedFilename()).toBe('Release QA Roundtrip.pdf');
    await expect(page.locator('h1', { hasText: 'Dein Storyboard ist fertig!' })).toBeVisible();

    await page.locator('summary', { hasText: 'Datei' }).click();
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Alle lokal gespeicherten Daten löschen');
      await dialog.accept();
    });
    await page.locator('button', { hasText: 'Zurücksetzen' }).click();
    await expect(page.locator('h1')).toContainText('Was möchtest du');

    await page.locator('input[accept=".storyboard,.zip"]').setInputFiles(projectPath!);
    await expect(page.getByLabel('Handlung / Bildbeschreibung')).toHaveValue(
      'Release-QA Szenentext',
    );
  });

  test('restores deleted scenes and reorders with buttons and keyboard drag', async ({ page }) => {
    await createBasicProject(page, 'Release QA Reorder');
    await page.getByLabel('Handlung / Bildbeschreibung').fill('Eins');
    await page.locator('button', { hasText: 'Szene hinzufügen' }).click();
    await page.getByLabel('Handlung / Bildbeschreibung').nth(1).fill('Zwei');
    await page.locator('button', { hasText: 'Szene hinzufügen' }).click();
    await page.getByLabel('Handlung / Bildbeschreibung').nth(2).fill('Drei');

    await page.locator('button[aria-label="Szene 1 löschen"]').click();
    await page.locator('button', { hasText: 'Rückgängig' }).click();
    await expect
      .poll(async () => sceneActionValues(page))
      .toEqual(['Eins', 'Zwei', 'Drei']);

    await page.locator('button[aria-label="Szene 3 nach oben verschieben"]').click();
    await expect
      .poll(async () => sceneActionValues(page))
      .toEqual(['Eins', 'Drei', 'Zwei']);

    await page.locator('button[aria-label="Szene 2 nach unten verschieben"]').click();
    await expect
      .poll(async () => sceneActionValues(page))
      .toEqual(['Eins', 'Zwei', 'Drei']);

    // Keep all sortable targets in the viewport so keyboard collision detection
    // behaves consistently across Chromium and WebKit.
    const moveUpWithKeyboard = async (sceneNumber: number) => {
      const handle = page.locator(`button[aria-label="Szene ${sceneNumber} verschieben"]`);
      await handle.focus();
      await handle.press('Space');
      await expect(
        page.getByText(`Szene über Position ${sceneNumber} bewegt.`, { exact: true }),
      ).toBeAttached();
      await handle.press('ArrowUp');
      await expect(
        page.getByText(`Szene über Position ${sceneNumber - 1} bewegt.`, { exact: true }),
      ).toBeAttached();
      await handle.press('Space');
      await expect(
        page.getByText(`Szene an Position ${sceneNumber - 1} abgelegt.`, { exact: true }),
      ).toBeAttached();
    };

    await page.locator('button', { hasText: 'Alle einklappen' }).click();
    await expect(page.getByLabel('Handlung / Bildbeschreibung')).toHaveCount(0);
    await moveUpWithKeyboard(3);
    await page.locator('button', { hasText: 'Alle ausklappen' }).click();
    await expect
      .poll(async () => sceneActionValues(page))
      .toEqual(['Eins', 'Drei', 'Zwei']);

    await page.locator('button', { hasText: 'Alle einklappen' }).click();
    await expect(page.getByLabel('Handlung / Bildbeschreibung')).toHaveCount(0);
    await moveUpWithKeyboard(2);
    await page.locator('button', { hasText: 'Alle ausklappen' }).click();

    await expect
      .poll(async () => sceneActionValues(page))
      .toEqual(['Drei', 'Eins', 'Zwei']);
  });

  for (const viewport of [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
  ]) {
    test(`does not overflow horizontally at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await createBasicProject(page, `Mobile ${viewport.width}`);

      const metrics = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));

      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
    });
  }
});

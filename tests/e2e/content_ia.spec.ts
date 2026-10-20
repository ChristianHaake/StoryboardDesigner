import { expect, test } from '@playwright/test';

test.describe('Content pages and navigation', () => {
  test('every route and wizard step has its own document title', async ({ page }) => {
    const routes: [string, string][] = [
      ['/hilfe', 'Hilfe'],
      ['/ueber', 'Über'],
      ['/lehrkraefte', 'Für Lehrkräfte'],
      ['/datenschutz', 'Datenschutz'],
      ['/impressum', 'Impressum'],
    ];
    for (const [path, title] of routes) {
      await page.goto(path);
      await expect(page).toHaveTitle(`${title} – Storyboard-Creator`);
    }
    await page.goto('/');
    await expect(page).toHaveTitle('Format – Storyboard-Creator');
    await page.locator('button', { hasText: 'Kurzfilm' }).first().click();
    await expect(page).toHaveTitle('Einrichten – Storyboard-Creator');
  });

  test('es/fr UI shows English content pages with a matching lang attribute and note', async ({
    page,
  }) => {
    await page.goto('/');
    for (const [lang, note] of [
      ['es', 'solo está disponible en inglés'],
      ['fr', 'qu’en anglais'],
    ] as const) {
      await page.evaluate((value) => localStorage.setItem('storyboard-creator:lang', value), lang);
      await page.goto('/hilfe');
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('.prose')).toHaveAttribute('lang', 'en');
      await expect(page.getByRole('note')).toContainText(note);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Help');
    }

    await page.goto('/datenschutz');
    await expect(page.locator('.prose')).toHaveAttribute('lang', 'de');
    await expect(page.getByRole('note')).toBeVisible();
  });

  test('de UI shows German help without a language note', async ({ page }) => {
    await page.goto('/hilfe');
    await expect(page.locator('.prose')).toHaveAttribute('lang', 'de');
    await expect(page.getByRole('note')).toHaveCount(0);
  });

  test('review step jumps to the chosen scene in the editor', async ({ page }) => {
    await page.goto('/');
    await page.locator('button', { hasText: 'Kurzfilm' }).first().click();
    await page.locator('#projectName').fill('Sprung Test');
    await page.locator('button', { hasText: 'Zum Editor' }).click();
    for (let i = 0; i < 3; i++) {
      await page.locator('button', { hasText: 'Szene hinzufügen' }).click();
    }
    await page.locator('button', { hasText: 'Prüfen & Abschließen' }).click();

    await page.getByRole('button', { name: 'Szene 3 bearbeiten' }).click();

    const thirdCard = page.locator('article[id^="scene-"]').nth(2);
    await expect(thirdCard).toBeFocused();
    await expect(thirdCard).toBeInViewport();
    await expect(page).toHaveTitle('Storyboard – Storyboard-Creator');
  });
});

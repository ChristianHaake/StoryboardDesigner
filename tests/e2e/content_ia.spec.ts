import { expect, test } from '@playwright/test';

test.describe('Content pages and navigation', () => {
  test('every route and wizard step has its own document title', async ({ page }) => {
    const routes: [string, string][] = [
      ['/hilfe', 'Hilfe'],
      ['/ueber', 'Über'],
      ['/lehrkraefte', 'Für Lehrkräfte'],
      ['/agb', 'AGB'],
      ['/unterstuetzen', 'Unterstützen'],
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

  test('footer routes to terms and internal support with safe feedback links', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'AGB' }).click();
    await expect(page).toHaveURL(/\/agb$/);
    await expect(page.getByRole('link', { name: 'apps@haak3.de' })).toHaveAttribute(
      'href',
      'mailto:apps@haak3.de',
    );
    await page.goto('/');
    await page.getByRole('link', { name: 'Spendier mir einen Kaffee' }).click();
    await expect(page).toHaveURL(/\/unterstuetzen$/);
    await expect(page.getByRole('link', { name: 'apps@haak3.de' })).toHaveAttribute(
      'href',
      'mailto:apps@haak3.de',
    );
    await expect(page.getByRole('link', { name: 'Kaffee spendieren' })).toHaveAttribute(
      'href',
      'https://buymeacoffee.com/Haake',
    );
    await expect(page.getByRole('link', { name: 'Kaffee spendieren' })).toHaveAttribute(
      'target',
      '_blank',
    );
    await expect(page.getByRole('link', { name: 'Kaffee spendieren' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  });

  test('legal pages show the shared contact address and analytics disclosure', async ({ page }) => {
    for (const path of ['/datenschutz', '/impressum', '/agb']) {
      await page.goto(path);
      await expect(page.getByRole('link', { name: 'apps@haak3.de' }).first()).toHaveAttribute(
        'href',
        'mailto:apps@haak3.de',
      );
    }
    await page.goto('/datenschutz');
    await expect(page.getByRole('link', { name: 'Cloudflare Web Analytics' })).toBeVisible();
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

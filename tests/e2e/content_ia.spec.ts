import { expect, test } from '@playwright/test';

test.describe('Content pages and navigation', () => {
  test('every route and wizard step has its own document title', async ({ page }) => {
    const routes: [string, string][] = [
      ['/hilfe', 'Hilfe'],
      ['/kontakt', 'Kontakt'],
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
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    await page.getByRole('link', { name: 'AGB' }).click();
    await expect(page).toHaveURL(/\/agb$/);
    await expect(page.getByRole('link', { name: 'apps@haak3.de' })).toHaveAttribute(
      'href',
      'mailto:apps@haak3.de',
    );
    await page.goto('/');
    const support = page.getByRole('link', { name: 'Unterstützen' });
    await expect(support).toHaveText('Unterstützen');
    expect((await support.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await support.click();
    await expect(page).toHaveURL(/\/unterstuetzen$/);
    await expect(page.locator('main a').first()).toHaveText('Kaffee spendieren');
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

  test('support uses the selected language and fits a narrow screen', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/unterstuetzen');
    for (const [lang, title, coffee] of [
      ['de', 'Storyboard-Creator unterstützen', 'Kaffee spendieren'],
      ['en', 'Support Storyboard-Creator', 'Buy me a coffee'],
      ['es', 'Apoyar a Storyboard-Creator', 'Invitar a un café'],
      ['fr', 'Soutenir Storyboard-Creator', 'Offrir un café'],
    ]) {
      await page.evaluate((value) => localStorage.setItem('storyboard-creator:lang', value), lang);
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
      const primaryLink = page.locator('main a').first();
      await expect(primaryLink).toHaveText(coffee);
      expect((await primaryLink.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    }
  });

  test('opening support and returning keeps the active editor project', async ({ page }) => {
    await page.goto('/');
    await page.locator('button', { hasText: 'Kurzfilm' }).first().click();
    await page.locator('#projectName').fill('Mein Storyboard');
    await page.getByRole('button', { name: 'Zum Editor' }).click();
    await page.getByRole('button', { name: 'Szene hinzufügen' }).click();
    const scene = page.locator('article[id^="scene-"]').first();
    await expect(scene).toBeVisible();

    await page.getByRole('link', { name: 'Unterstützen' }).click();
    await expect(page).toHaveURL(/\/unterstuetzen$/);
    await page.locator('main a[href="/editor"]').click();
    await expect(page).toHaveURL(/\/editor$/);
    await expect(scene).toBeVisible();
    await expect(page.getByText('Mein Storyboard', { exact: true }).first()).toBeVisible();
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

  test('contact page exposes safe creator social links', async ({ page }) => {
    await page.goto('/kontakt');
    for (const [name, href] of [
      ['LinkedIn', 'https://www.linkedin.com/in/christianhaake/'],
      ['Instagram', 'https://www.instagram.com/_haake/'],
      ['Threads', 'https://www.threads.com/@_haake'],
    ]) {
      const link = page.getByRole('link', { name, exact: true });
      await expect(link).toHaveAttribute('href', href);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  test('help and support link safely to the creator feedback forms', async ({ page }) => {
    for (const path of ['/hilfe', '/unterstuetzen']) {
      await page.goto(path);
      for (const [name, href] of [
        ['Fehler melden', 'https://haak3.atlassian.net/jira/software/form/69a50efc-0474-445e-8f01-66eb6b747cc1'],
        ['Funktion vorschlagen', 'https://haak3.atlassian.net/jira/software/form/50d4fc51-bff4-4e21-b46e-8fd987b90d24'],
      ]) {
        const link = page.getByRole('link', { name, exact: true });
        await expect(link).toHaveAttribute('href', href);
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
    }
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

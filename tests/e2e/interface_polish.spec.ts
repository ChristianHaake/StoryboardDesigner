import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function setPreferences(page: Page, language: string, fontScale: 'normal' | 'xlarge') {
  await page.evaluate(
    ({ language, fontScale }) => {
      localStorage.setItem('storyboard-creator:lang', language);
      localStorage.setItem('storyboard-creator:fontScale', fontScale);
    },
    { language, fontScale },
  );
  await page.reload();
}

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
}

async function expectShellTargetsAreTouchSized(page: Page) {
  const undersized = await page.locator('header, footer').evaluateAll((roots) =>
    roots.flatMap((root) =>
      Array.from(root.querySelectorAll<HTMLElement>('a, button, summary'))
        .filter((element) => {
          const style = getComputedStyle(element);
          return (
            style.visibility !== 'hidden' &&
            style.display !== 'none' &&
            element.getClientRects().length > 0
          );
        })
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            name:
              element.getAttribute('aria-label') ||
              element.getAttribute('title') ||
              element.textContent?.trim() ||
              element.tagName,
            width: rect.width,
            height: rect.height,
          };
        })
        .filter(({ width, height }) => width < 44 || height < 44),
    ),
  );
  expect(undersized).toEqual([]);
}

async function openEmptyEditor(page: Page) {
  await page.goto('/');
  await page.locator('button', { hasText: 'Kurzfilm' }).click();
  await page.locator('#projectName').fill('Interface Regression');
  await page.locator('button', { hasText: 'Zum Editor' }).click();
}

test.describe('Interface polish regressions', () => {
  test('localized shell does not overflow at responsive boundaries and large text', async ({
    page,
  }) => {
    await page.goto('/');

    for (const width of [320, 390, 601, 768]) {
      await page.setViewportSize({ width, height: 844 });
      for (const language of ['de', 'en', 'es', 'fr']) {
        await setPreferences(page, language, width <= 390 ? 'xlarge' : 'normal');
        await expectNoHorizontalOverflow(page);
      }
    }
  });

  test('mobile document actions keep unique names and shell targets are 44px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto('/');
    await setPreferences(page, 'de', 'xlarge');
    await openEmptyEditor(page);

    const present = page.getByRole('button', { name: 'Präsentieren', exact: true });
    const print = page.getByRole('button', { name: 'Drucken', exact: true });
    const pdf = page.getByRole('button', { name: 'PDF', exact: true });
    await expect(present).toBeDisabled();
    await expect(print).toBeDisabled();
    await expect(pdf).toBeDisabled();
    await expect(page.getByRole('link', { name: 'Für Lehrkräfte', exact: true })).toBeVisible();
    for (const control of [present, print, pdf]) {
      await expect(control).toHaveAttribute('aria-describedby', 'document-actions-require-scene');
    }

    await expectShellTargetsAreTouchSized(page);
    await expectNoHorizontalOverflow(page);
  });

  test('shell and scene-title targets remain 44px at the 640px reflow proxy', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 720 });
    await page.goto('/');
    await setPreferences(page, 'de', 'normal');

    await expectShellTargetsAreTouchSized(page);
    await expectNoHorizontalOverflow(page);

    await openEmptyEditor(page);
    await page.locator('button', { hasText: 'Szene hinzufügen' }).click();
    const sceneTitle = page.getByRole('textbox', { name: 'Szene 1', exact: true });
    const sceneTitleBox = await sceneTitle.boundingBox();
    expect(sceneTitleBox).not.toBeNull();
    expect(sceneTitleBox!.width).toBeGreaterThanOrEqual(44);
    expect(sceneTitleBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('step changes move focus to the new heading', async ({ page }) => {
    await page.goto('/');
    await page.locator('button', { hasText: 'Kurzfilm' }).click();
    await expect(page.locator('h1')).toBeFocused();
    await page.locator('#projectName').fill('Focus Regression');
    await page.locator('button', { hasText: 'Zum Editor' }).click();
    await expect(page.locator('h1', { hasText: 'Focus Regression' })).toBeFocused();

    await page.locator('button', { hasText: 'Szene hinzufügen' }).click();
    await page.locator('button', { hasText: 'Prüfen & Abschließen' }).click();
    await expect(page.locator('h1', { hasText: 'Projekt prüfen' })).toBeFocused();
    await page.locator('button', { hasText: 'Weiter zum Export' }).click();
    await expect(page.locator('h1', { hasText: 'Dein Storyboard ist fertig!' })).toBeFocused();
  });

  test('sticky desktop header keeps stable geometry and does not intercept body actions', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await openEmptyEditor(page);
    const addScene = page.locator('button', { hasText: 'Szene hinzufügen' });
    await addScene.click();
    await addScene.click();
    await addScene.click();

    const header = page.locator('header').first();
    const before = await header.boundingBox();
    await page.evaluate(() => window.scrollTo(0, 600));
    const after = await header.boundingBox();
    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(after!.height).toBeCloseTo(before!.height, 0);
    expect(after!.y).toBeCloseTo(0, 0);

    await page.locator('button[title="Kommentare"]').click();
    await expect(page.locator('section[aria-label^="Kommentare zu Szene"]')).toHaveCount(3);
    await addScene.click();
    await expect(page.getByLabel('Handlung / Bildbeschreibung')).toHaveCount(4);
  });
});

test.describe('Reduced motion regressions', () => {
  test('production CSS collapses transition and animation durations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect
      .poll(() =>
        page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
      )
      .toBe(true);

    const longestDurationMs = await page.locator('body').evaluate((body) => {
      const durationInMs = (value: string) =>
        value.split(',').map((duration) => {
          const normalized = duration.trim();
          const numeric = Number.parseFloat(normalized);
          return normalized.endsWith('ms') ? numeric : numeric * 1000;
        });

      return Math.max(
        0,
        ...Array.from(body.querySelectorAll<HTMLElement>('*')).flatMap((element) => {
          const style = getComputedStyle(element);
          return [
            ...durationInMs(style.transitionDuration),
            ...durationInMs(style.animationDuration),
          ];
        }),
      );
    });

    expect(longestDurationMs).toBeLessThanOrEqual(0.01);
  });
});

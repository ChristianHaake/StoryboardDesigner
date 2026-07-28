import { expect, test } from '@playwright/test';

const CASES = [
  { category: 'Video & Animation', format: 'Kurzfilm', textLabel: 'Sprechtext / Voiceover' },
  { category: 'Video & Animation', format: 'Erklärvideo', textLabel: 'Voiceover' },
  { category: 'Video & Animation', format: 'Stop-Motion', textLabel: 'Ton / Text (optional)' },
  {
    category: 'Video & Animation',
    format: 'Social-Media-Clip',
    textLabel: 'Sprechtext / Caption',
  },
  { category: 'Bildgeschichte', format: 'Fotostory', textLabel: 'Sprechblase / Dialogtext' },
  { category: 'Bildgeschichte', format: 'Comic', textLabel: 'Sprechblase / Dialogtext' },
  { category: 'Audio', format: 'Hörspiel', textLabel: 'Sprechtext / Dialog' },
  { category: 'Audio', format: 'Podcast', textLabel: 'Sprechertext / Notizen' },
  { category: 'Bühne', format: 'Rollenspiel/Theater', textLabel: 'Sprechtext / Dialog' },
] as const;

test.describe('format-specific reduced field matrix', () => {
  for (const testCase of CASES) {
    test(`${testCase.format} starts with its reduced basic fields`, async ({ page }) => {
      await page.goto('/');
      await page.getByRole('tab', { name: testCase.category }).click();
      await page.getByRole('button', { name: new RegExp(`^${testCase.format}`) }).click();

      await expect(page.getByRole('button', { name: /Einfach/ })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await page.getByLabel('Projektname *').fill(`Test ${testCase.format}`);
      await page.getByRole('button', { name: 'Zum Editor' }).click();
      await page.getByRole('button', { name: '+ Szene hinzufügen' }).click();

      await expect(page.getByLabel(testCase.textLabel)).toBeVisible();
      await expect(page.getByLabel('Dialog', { exact: true })).toHaveCount(0);
    });
  }

  test('category tabs support arrow-key navigation', async ({ page }) => {
    await page.goto('/');
    const video = page.getByRole('tab', { name: 'Video & Animation' });
    await video.focus();
    await video.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Bildgeschichte' })).toBeFocused();
    await expect(page.getByRole('heading', { name: 'Fotostory' })).toBeVisible();
  });

  test('custom format remains a secondary reduced entry point', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Eigene Idee/ }).click();
    await page.getByLabel('Projektname *').fill('Freies Projekt');
    await page.getByRole('button', { name: 'Zum Editor' }).click();
    await page.getByRole('button', { name: '+ Szene hinzufügen' }).click();

    await expect(page.getByLabel('Sprechtext / Voiceover')).toBeVisible();
    await expect(page.getByLabel('Dialog', { exact: true })).toHaveCount(0);
  });
});

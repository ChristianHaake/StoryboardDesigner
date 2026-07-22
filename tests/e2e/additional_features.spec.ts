import { test, expect } from '@playwright/test';
import { zipSync, strToU8 } from 'fflate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Storyboard Creator Additional Features E2E Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Was möchtest du');
  });

  test('1. Undo / Redo for Editor Changes', async ({ page }) => {
    // Choose format
    await page.locator('button', { hasText: 'Kurzfilm' }).click();

    // Name project
    await page.locator('#projectName').fill('Undo Redo Test');
    await page.locator('button', { hasText: 'Zum Editor' }).click();

    // Add scene and test undo/redo
    const addSceneBtn = page.locator('button', { hasText: 'Szene hinzufügen' });
    await addSceneBtn.click();
    const sceneCardInput = page.locator('input[placeholder="Szene 1"]');
    await expect(sceneCardInput).toBeVisible();

    // Add second scene
    await addSceneBtn.click();
    const sceneCardInput2 = page.locator('input[placeholder="Szene 2"]');
    await expect(sceneCardInput2).toBeVisible();

    // Undo second scene creation
    await page.locator('button[title="Rückgängig"]').click();
    await expect(sceneCardInput2).not.toBeVisible();
    await expect(sceneCardInput).toBeVisible();

    // Redo second scene creation
    await page.locator('button[title="Wiederholen"]').click();
    await expect(sceneCardInput2).toBeVisible();
  });

  test('2. IndexedDB Autosave & Page Reload', async ({ page }) => {
    // Choose format
    await page.locator('button', { hasText: 'Kurzfilm' }).click();

    // Fill project metadata
    await page.locator('#projectName').fill('Autosave Test Projekt');
    await page.locator('#topic').fill('Autosave Thema');
    await page.locator('button', { hasText: 'Zum Editor' }).click();

    // Add a scene
    await page.locator('button', { hasText: 'Szene hinzufügen' }).click();
    const sceneTitle = page.locator('input[placeholder="Szene 1"]');
    await sceneTitle.fill('Gesicherte Szene');
    await sceneTitle.blur();

    // Wait for autosave to propagate to IndexedDB (wait for saved status)
    await expect(page.locator('span[role="status"]')).toContainText('Gespeichert');

    // Reload page
    await page.reload();

    // Go back to setup screen to check metadata
    await page.locator('button', { hasText: 'Zurück zu Einstellungen' }).click();

    // Verify the project was loaded from autosave
    await expect(page.locator('#projectName')).toHaveValue('Autosave Test Projekt');
    await expect(page.locator('#topic')).toHaveValue('Autosave Thema');

    // Return to editor to check scene
    await page.locator('button', { hasText: 'Zum Editor' }).click();
    await expect(page.locator('input[placeholder="Szene 1"]')).toHaveValue('Gesicherte Szene');
  });

  test('3. Comments / Feedback Mode', async ({ page }) => {
    // Choose format and enter editor
    await page.locator('button', { hasText: 'Kurzfilm' }).click();
    await page.locator('#projectName').fill('Feedback Test');
    await page.locator('button', { hasText: 'Zum Editor' }).click();

    // Add scene
    await page.locator('button', { hasText: 'Szene hinzufügen' }).click();

    // Turn on Feedback Mode
    await page.locator('button[title="Kommentare"]').click();

    // Verify comment thread is visible on Scene Card 1
    const commentThread = page.locator('section[aria-label="Feedback zu Szene 1"]');
    await expect(commentThread).toBeVisible();

    // Add a comment
    const commentInput = commentThread.locator('input[placeholder="Kommentar schreiben …"]');
    await commentInput.fill('Das Bild sollte dramatischer wirken.');
    await commentThread.locator('button', { hasText: 'Senden' }).click();

    // Verify comment is added
    await expect(commentThread.locator('span', { hasText: 'Das Bild sollte dramatischer wirken.' })).toBeVisible();

    // Toggle checked state
    const checkbox = commentThread.locator('input[type="checkbox"]');
    await checkbox.click();
    await expect(commentThread.locator('span', { hasText: 'Das Bild sollte dramatischer wirken.' })).toHaveClass(/line-through/);

    // Delete comment
    await commentThread.locator('button[aria-label^="Kommentar"]').click();
    await expect(commentThread.locator('span', { hasText: 'Das Bild sollte dramatischer wirken.' })).not.toBeVisible();

    // Turn feedback mode off
    await page.locator('button[title="Feedback"]').click();
    await expect(commentThread).not.toBeVisible();
  });

  test('4. Custom Fields Management (Dropdowns & Text Fields)', async ({ page }) => {
    // Start project
    await page.locator('button', { hasText: 'Kurzfilm' }).click();
    await page.locator('#projectName').fill('Custom Fields Test');
    await page.locator('button', { hasText: 'Zum Editor' }).click();

    // Add scene
    await page.locator('button', { hasText: 'Szene hinzufügen' }).click();

    // Open configuration dialog
    await page.locator('button', { hasText: 'Felder konfigurieren' }).click();
    const dialog = page.locator('dialog');
    await expect(dialog).toBeVisible();

    // Add text field "Requisite"
    await page.locator('#newFieldName').fill('Requisite');
    await page.locator('#newFieldDesc').fill('Gegenstände im Bild');
    await page.locator('#newFieldType').selectOption('text');
    await page.locator('button', { hasText: /^Hinzufügen$/ }).click();

    // Add select field "Kameraperspektive"
    await page.locator('#newFieldName').fill('Kameraperspektive');
    await page.locator('#newFieldDesc').fill('Ausrichtung der Kamera');
    await page.locator('#newFieldType').selectOption('select');
    await page.locator('#newFieldOptions').fill('Frosch\nNormal\nVogel');
    await page.locator('button', { hasText: /^Hinzufügen$/ }).click();

    // Close Dialog
    await page.locator('button[aria-label="Dialog schließen"]').click();
    await expect(dialog).not.toBeVisible();

    // Verify fields appear on the scene card
    const textLabel = page.locator('label', { hasText: 'Requisite' });
    const selectLabel = page.locator('label', { hasText: 'Kameraperspektive' });
    await expect(textLabel).toBeVisible();
    await expect(selectLabel).toBeVisible();

    // Fill values
    const textarea = page.locator('textarea[placeholder="Requisite eingeben"]');
    await textarea.fill('Kaffeetasse');
    await textarea.blur();

    const select = page.getByLabel('Kameraperspektive').first();
    await select.selectOption('Vogel');
    await select.blur();

    // Wait for save
    await expect(page.locator('span[role="status"]')).toContainText('Gespeichert');
    await page.reload();

    await expect(page.locator('textarea[placeholder="Requisite eingeben"]')).toHaveValue('Kaffeetasse');
    await expect(page.getByLabel('Kameraperspektive').first()).toHaveValue('Vogel');

    // Remove field definition
    await page.locator('button', { hasText: 'Felder konfigurieren' }).click();
    await expect(dialog).toBeVisible();

    // Click delete for "Requisite"
    page.once('dialog', async (d) => {
      await d.accept();
    });
    await page.locator('button[aria-label="Feld Requisite löschen"]').click();

    // Close Dialog
    await page.locator('button[aria-label="Dialog schließen"]').click();
    await expect(dialog).not.toBeVisible();

    // Verify Requisite is gone but Kameraperspektive is still there
    await expect(page.locator('label', { hasText: 'Requisite' })).not.toBeVisible();
    await expect(page.locator('label', { hasText: 'Kameraperspektive' })).toBeVisible();
  });

  test('5. Image Upload & Fit Settings', async ({ page }) => {
    // Start project
    await page.locator('button', { hasText: 'Kurzfilm' }).click();
    await page.locator('#projectName').fill('Image Test');
    await page.locator('button', { hasText: 'Zum Editor' }).click();

    // Add scene
    await page.locator('button', { hasText: 'Szene hinzufügen' }).click();

    // Read real image file from public folder
    const imagePath = path.join(__dirname, '../../public/pwa-192x192.png');
    const fileBuffer = fs.readFileSync(imagePath);

    // Attach mock image
    const fileInput = page.locator('input[accept="image/png,image/jpeg"]').first();
    await fileInput.setInputFiles({
      name: 'pwa-192x192.png',
      mimeType: 'image/png',
      buffer: fileBuffer,
    });

    // Check image element is visible
    const img = page.locator('article img').first();
    await expect(img).toBeVisible();
    await expect(img).toHaveClass(/object-cover/); // default fit

    // Alt text input should be visible
    const altInput = page.locator('textarea[id^="alt-"]').first();
    await expect(altInput).toBeVisible();
    await altInput.fill('Ein kleiner Hund rennt.');
    await altInput.blur();

    // Verify alt text updated
    await expect(img).toHaveAttribute('alt', 'Ein kleiner Hund rennt.');

    // Hover to reveal overlay controls
    await img.hover();

    // Toggle fit to Contain
    const fitButton = page.locator('button', { hasText: 'Einpassen' });
    await expect(fitButton).toBeVisible();
    await fitButton.click();
    await expect(img).toHaveClass(/object-contain/);

    // Toggle back to Cover
    await img.hover();
    const coverButton = page.locator('button', { hasText: 'Füllen' });
    await expect(coverButton).toBeVisible();
    await coverButton.click();
    await expect(img).toHaveClass(/object-cover/);

    // Delete image
    const removeButton = page.locator('button[aria-label^="Bild der Szene 1 entfernen"]');
    await removeButton.click();
    await expect(img).not.toBeVisible();
  });

  test('6. Presentation (Play) Mode Slide Limits', async ({ page }) => {
    // Start project and add scenes
    await page.locator('button', { hasText: 'Kurzfilm' }).click();
    await page.locator('#projectName').fill('Play Mode Test');
    await page.locator('button', { hasText: 'Zum Editor' }).click();

    // Add Scene 1 and Scene 2
    await page.locator('button', { hasText: 'Szene hinzufügen' }).click();
    await page.locator('input[placeholder="Szene 1"]').fill('Eins');
    await page.locator('button', { hasText: 'Szene hinzufügen' }).click();
    await page.locator('input[placeholder="Szene 2"]').fill('Zwei');

    // Go to Presentation View client-side using TopBar Link (to preserve Zustand state)
    await page.locator('a[href="/play"]').first().click();
    await expect(page.locator('div').filter({ hasText: '1 / 2' }).first()).toBeVisible();

    // Press Left arrow at start -> should stay on slide 1
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('div').filter({ hasText: '1 / 2' }).first()).toBeVisible();

    // Press Right arrow -> slide 2
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('div').filter({ hasText: '2 / 2' }).first()).toBeVisible();

    // Press Right arrow at end -> should stay on slide 2
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('div').filter({ hasText: '2 / 2' }).first()).toBeVisible();

    // Exit presentation
    await page.locator('button[aria-label="Präsentation beenden"]').click();
    await expect(page.url()).not.toContain('/play');
  });

  test('7. File Operations (Reset & Import)', async ({ page }) => {
    // Start project
    await page.locator('button', { hasText: 'Kurzfilm' }).click();
    await page.locator('#projectName').fill('Project to Reset');
    await page.locator('button', { hasText: 'Zum Editor' }).click();

    // Reset project
    await page.locator('summary', { hasText: 'Datei' }).click();
    page.once('dialog', async (d) => {
      expect(d.message()).toContain('Alle lokal gespeicherten Daten löschen');
      await d.accept();
    });
    await page.locator('button', { hasText: 'Zurücksetzen' }).click();

    // Should return to Start Screen
    await expect(page.locator('h1')).toContainText('Was möchtest du');

    // Load / Import Project from ZIP file
    // Construct mock zip payload
    const projectData = {
      version: '1.5',
      metaData: {
        id: 'imported-id',
        projectName: 'Geladenes Projekt',
        topic: 'Import-Wissen',
        subject: 'Informatik',
        groupMembers: ['Anna'],
        productType: 'explainerVideo',
        complexity: 'standard',
        date: new Date().toISOString(),
      },
      prePlanning: {
        logline: 'Projekt importieren klappt.',
        objective: 'Testen',
        roles: 'Niemand',
        resources: 'Rechner',
      },
      scenes: [
        {
          id: 'imported-scene-1',
          orderIndex: 0,
          imageFileName: null,
          title: 'Importierte Szene',
          action: 'Daten wurden erfolgreich eingelesen.',
          text: '',
          audio: { dialogue: '', soundEffects: '', music: '' },
          camera: { shotSize: '', angle: '', movement: '' },
          location: '',
          materials: [],
        },
      ],
    };

    const zipBuffer = zipSync({
      'data.json': strToU8(JSON.stringify(projectData)),
    });

    // File input is hidden but we can set files directly
    const fileInput = page.locator('input[accept=".storyboard,.zip"]');
    await fileInput.setInputFiles({
      name: 'imported.storyboard',
      mimeType: 'application/zip',
      buffer: Buffer.from(zipBuffer),
    });

    // Go back to setup screen to check metadata
    await page.locator('button', { hasText: 'Zurück zu Einstellungen' }).click();

    // Verify metadata
    await expect(page.locator('#projectName')).toHaveValue('Geladenes Projekt');
    await expect(page.locator('#topic')).toHaveValue('Import-Wissen');

    // Return to editor to check scene
    await page.locator('button', { hasText: 'Zum Editor' }).click();
    await expect(page.locator('input[placeholder="Szene 1"]')).toHaveValue('Importierte Szene');
  });
});

import { test, expect } from '@playwright/test';

test.describe('Storyboard Creator E2E Browser Click Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Open the local development server URL configured in playwright.config.ts
    await page.goto('/');
    // Check that we are on the landing page
    await expect(page.locator('h1')).toContainText('Was möchtest du');
  });

  test('1. Toggle Languages, Themes, and Font Scales', async ({ page }) => {
    // A. Check default German text
    await expect(page.locator('button', { hasText: 'Kurzfilm' })).toBeVisible();

    // B. Switch to English
    await page.locator('button', { hasText: /^EN$/ }).click();
    // Verify translation occurred
    await expect(page.locator('button', { hasText: 'Short Film' })).toBeVisible();

    // C. Switch back to German
    await page.locator('button', { hasText: /^DE$/ }).click();
    await expect(page.locator('button', { hasText: 'Kurzfilm' })).toBeVisible();

    // D. Cycle Themes (light -> dark -> contrast -> light)
    // Initially, there should be no data-theme attribute (default light theme)
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');

    // Click cycle theme button (represented by sun/moon/contrast icon)
    await page.locator('button[title^="Darstellung:"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.locator('button[title^="Darstellung:"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'contrast');

    await page.locator('button[title^="Darstellung:"]').click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');

    // E. Cycle Font Scales (normal -> large -> xlarge -> normal)
    await expect(page.locator('html')).not.toHaveAttribute('data-font');

    await page.locator('button[title^="Schriftgröße:"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-font', 'large');

    await page.locator('button[title^="Schriftgröße:"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-font', 'xlarge');

    await page.locator('button[title^="Schriftgröße:"]').click();
    await expect(page.locator('html')).not.toHaveAttribute('data-font');
  });

  test('2. Complete Storyboard Creation and Editor Workflow', async ({ page }) => {
    // A. Choose Format Tile: "Kurzfilm" (shortFilm)
    await page.locator('button', { hasText: 'Kurzfilm' }).click();

    // B. Setup Screen Validation
    // Validate "Zum Editor" is disabled initially because project name is empty
    const toEditorButton = page.locator('button', { hasText: 'Zum Editor' });
    await expect(toEditorButton).toBeDisabled();

    // Fill project metadata
    await page.locator('#projectName').fill('Die Plastik-Krise im Ozean');
    await expect(toEditorButton).toBeEnabled();

    await page.locator('#topic').fill('Umweltschutz');
    await page.locator('#subject').fill('Biologie');
    await page.locator('#groupMembers').fill('Alice, Bob, Charlie');
    // Blur to trigger store updates
    await page.locator('#groupMembers').blur();

    // Switch Complexity / Details Level to Profi (advanced)
    await page.locator('button', { hasText: 'Profi' }).click();

    // Click "Zum Editor" to enter editor mode
    await toEditorButton.click();

    // C. Editor Mode: Pre-Planning inputs
    // Toggle the Planning summary to ensure it's open (it will automatically open if it has content, but let's click it if not open)
    const planningDetails = page.locator('details.group:has(summary h2:text("Planung"))');
    await expect(planningDetails).toBeVisible();
    await page.locator('summary', { hasText: 'Planung' }).click();
    await expect(planningDetails).toHaveAttribute('open');

    await page.locator('#logline').fill('Ein Satz über die Müllberge im Meer.');
    await page.locator('#objective').fill('Zuschauer lernen plastikfrei zu leben.');
    await page.locator('#roles').fill('Alice: Regie, Bob: Schnitt.');
    await page.locator('#resources').fill('Kamera, Stativ, Plastikflasche.');

    // D. Editor Mode: Scenes Management
    // Validate empty state since there are no scenes initially
    await expect(page.locator('p', { hasText: 'Noch keine' })).toBeVisible();

    // Add Scene 1
    const addSceneButton = page.locator('button', { hasText: 'Szene hinzufügen' });
    await addSceneButton.click();

    // Scene Card 1 should appear
    await expect(page.locator('input[placeholder="Szene 1"]')).toBeVisible();

    // Fill Scene 1 details
    await page.locator('input[placeholder="Szene 1"]').fill('Einführung Plastikflasche');
    await page.locator('textarea[placeholder="Was passiert im Bild?"]').fill('Eine Plastikflasche schwimmt im Meer.');
    await page.locator('textarea[placeholder="Was wird gesprochen?"]').fill('Täglich werfen wir Tonnen von Plastik weg.');
    await page.locator('textarea[placeholder="Wer spricht mit wem?"]').fill('Sprecher aus dem Off.');
    await page.locator('textarea[placeholder="Geräusche oder Musik"]').fill('Meeresrauschen im Hintergrund.');
    await page.locator('textarea[placeholder="Wo findet die Szene statt?"]').fill('Pazifischer Ozean.');
    // Einstellungsgröße kommt bei Kurzfilm aus dem Format-Preset (Dropdown), nicht
    // mehr als generisches Freitextfeld.
    await page.getByLabel('Kameraeinstellung').first().selectOption({ label: 'Totale' });

    // Add Scene 2
    await addSceneButton.click();
    await expect(page.locator('input[placeholder="Szene 2"]')).toBeVisible();
    await page.locator('input[placeholder="Szene 2"]').fill('Alternative Produkte');

    // Verify Scene Navigator is now visible (requires >= 2 scenes)
    const navigator = page.locator('nav[aria-label="Szenen-Navigation"]');
    await expect(navigator).toBeVisible();

    // Click "Zu Szene 1 springen" navigator jump button
    await page.locator('button[aria-label="Zu Szene 1 springen"]').click();

    // E. Custom Fields Dialog
    await page.locator('button', { hasText: 'Felder konfigurieren' }).click();
    const configDialog = page.locator('dialog');
    await expect(configDialog).toBeVisible();

    // Add custom text field "Lichtstimmung"
    await page.locator('#newFieldName').fill('Lichtstimmung');
    await page.locator('#newFieldDesc').fill('Sonne, Wolken oder Kunstlicht');
    await page.locator('button', { hasText: /^Hinzufügen$/ }).click();

    // Verify it appeared in active list
    await expect(page.locator('input[aria-label="Feldbezeichnung Lichtstimmung"]')).toHaveValue('Lichtstimmung');

    // Close Dialog
    await page.locator('button[aria-label="Dialog schließen"]').click();
    await expect(configDialog).not.toBeVisible();

    // Verify the new custom field input is displayed in the scene card
    await expect(page.locator('label', { hasText: 'Lichtstimmung' }).first()).toBeVisible();
    await page.locator('textarea[placeholder="Lichtstimmung eingeben"]').first().fill('Sonnenschein hell');

    // F. Scene Duplicate & Delete
    // Duplicate Scene 1 (becomes Scene 2, moving former Scene 2 to index 3)
    await page.locator('button[aria-label="Szene 1 duplizieren"]').click();
    await expect(page.locator('input[placeholder="Szene 3"]')).toBeVisible(); // Check that total count is now 3

    // Delete Scene 3
    await page.locator('button[aria-label="Szene 3 löschen"]').click();
    await expect(page.locator('input[placeholder="Szene 3"]')).not.toBeVisible(); // Gone

    // Click Undo in the toast/notification
    await page.locator('button', { hasText: 'Rückgängig' }).click();
    await expect(page.locator('input[placeholder="Szene 3"]')).toBeVisible(); // Restored!

    // G. Feedback / Comments Mode
    // Toggle Feedback Mode
    await page.locator('button[title="Feedback"]').click();

    // Verify comment thread is visible on Scene Card 1
    const commentThread = page.locator('section[aria-label="Feedback zu Szene 1"]');
    await expect(commentThread).toBeVisible();

    // Add a comment
    const commentInput = commentThread.locator('input[placeholder="Kommentar schreiben …"]');
    await commentInput.fill('Das Bild sollte dramatischer wirken.');
    await commentThread.locator('button', { hasText: 'Senden' }).click();

    // Verify comment is added
    await expect(commentThread.locator('span', { hasText: 'Das Bild sollte dramatischer wirken.' })).toBeVisible();

    // Check it done (strike-through)
    await commentThread.locator('input[type="checkbox"]').click();
    await expect(commentThread.locator('span', { hasText: 'Das Bild sollte dramatischer wirken.' })).toHaveClass(/line-through/);

    // Delete the comment
    await commentThread.locator('button[aria-label^="Kommentar"]').click();
    await expect(commentThread.locator('span', { hasText: 'Das Bild sollte dramatischer wirken.' })).not.toBeVisible();

    // Turn feedback mode off
    await page.locator('button[title="Feedback"]').click();
    await expect(commentThread).not.toBeVisible();

    // H. Move to Step 4: Review Screen
    await page.locator('button', { hasText: 'Prüfen & Abschließen' }).click();

    // Verify we are on review screen
    await expect(page.locator('h1')).toContainText('Projekt prüfen');
    await expect(page.locator('span', { hasText: 'Einführung Plastikflasche' }).first()).toBeVisible();

    // I. Move to Step 5: Export Screen
    await page.locator('button', { hasText: 'Weiter zum Export' }).click();
    await expect(page.locator('h1')).toContainText('Dein Storyboard ist fertig!');

    // J. Presentation View Test
    await page.locator('a', { hasText: 'Präsentation starten' }).click();
    // We are on /play
    await expect(page.url()).toContain('/play');
    // Navigation check
    await expect(page.locator('div').filter({ hasText: '1 / 3' }).first()).toBeVisible();

    // Press arrow right to navigate to next slide
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('div').filter({ hasText: '2 / 3' }).first()).toBeVisible();

    // Exit Presentation
    await page.locator('button[aria-label="Präsentation beenden"]').click();
    await expect(page.url()).not.toContain('/play');
    // Ensure we are back on the export screen
    await expect(page.locator('h1')).toContainText('Dein Storyboard ist fertig!');
  });
});

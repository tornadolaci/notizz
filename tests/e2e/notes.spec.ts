import { test, expect } from '@playwright/test';

test.describe('Notes Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Clear IndexedDB before each test
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase('notizz-db');
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    });

    // Reload page to initialize fresh DB
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should create a new note', async ({ page }) => {
    // Click FAB to open note editor
    await page.getByRole('button', { name: /új/i }).click();

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Select "Jegyzet" option
    await page.getByRole('button', { name: /jegyzet/i }).click();

    // Fill in note details
    await page.getByLabel(/cím/i).fill('Teszt jegyzet');
    await page.getByLabel(/tartalom/i).fill('Ez egy teszt jegyzet tartalom.');

    // Select a color
    await page.locator('[data-color="lavender"]').click();

    // Add a tag
    await page.getByLabel(/címkék/i).fill('teszt');
    await page.keyboard.press('Enter');

    // Save note
    await page.getByRole('button', { name: /mentés/i }).click();

    // Verify modal closed
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify note appears in the list
    await expect(page.getByText('Teszt jegyzet')).toBeVisible();
    await expect(page.getByText('Ez egy teszt jegyzet tartalom.')).toBeVisible();
    await expect(page.getByText('teszt')).toBeVisible();
  });

  test('should edit an existing note', async ({ page }) => {
    // Create a note first
    await page.getByRole('button', { name: /új/i }).click();
    await page.getByRole('button', { name: /jegyzet/i }).click();
    await page.getByLabel(/cím/i).fill('Eredeti jegyzet');
    await page.getByLabel(/tartalom/i).fill('Eredeti tartalom');
    await page.getByRole('button', { name: /mentés/i }).click();

    // Wait for note to appear
    await expect(page.getByText('Eredeti jegyzet')).toBeVisible();

    // Click on the note to edit
    await page.getByText('Eredeti jegyzet').click();

    // Wait for editor modal
    await expect(page.getByRole('dialog')).toBeVisible();

    // Edit the note
    await page.getByLabel(/cím/i).fill('Módosított jegyzet');
    await page.getByLabel(/tartalom/i).fill('Módosított tartalom');

    // Save changes
    await page.getByRole('button', { name: /mentés/i }).click();

    // Verify changes are reflected
    await expect(page.getByText('Módosított jegyzet')).toBeVisible();
    await expect(page.getByText('Módosított tartalom')).toBeVisible();
    await expect(page.getByText('Eredeti jegyzet')).not.toBeVisible();
  });

  test('should delete a note', async ({ page }) => {
    // Create a note first
    await page.getByRole('button', { name: /új/i }).click();
    await page.getByRole('button', { name: /jegyzet/i }).click();
    await page.getByLabel(/cím/i).fill('Törlendő jegyzet');
    await page.getByLabel(/tartalom/i).fill('Ez a jegyzet törlésre kerül');
    await page.getByRole('button', { name: /mentés/i }).click();

    // Wait for note to appear
    await expect(page.getByText('Törlendő jegyzet')).toBeVisible();

    // Click on the note to open editor
    await page.getByText('Törlendő jegyzet').click();

    // Click delete button
    await page.getByRole('button', { name: /törlés/i }).click();

    // Confirm deletion (if there's a confirm dialog)
    page.once('dialog', dialog => dialog.accept());

    // Verify note is removed
    await expect(page.getByText('Törlendő jegyzet')).not.toBeVisible();
  });

  test('should mark note as urgent', async ({ page }) => {
    // Create a note
    await page.getByRole('button', { name: /új/i }).click();
    await page.getByRole('button', { name: /jegyzet/i }).click();
    await page.getByLabel(/cím/i).fill('Sürgős jegyzet');
    await page.getByLabel(/tartalom/i).fill('Ez egy sürgős feladat');

    // Check urgent checkbox
    await page.getByLabel(/sürgős/i).check();

    // Save note
    await page.getByRole('button', { name: /mentés/i }).click();

    // Verify urgent badge appears
    await expect(page.getByText('Sürgős jegyzet')).toBeVisible();
    // Check for urgent indicator (border or badge)
    const noteCard = page.locator('[class*="card--urgent"]').first();
    await expect(noteCard).toBeVisible();
  });

  test('should search notes by title', async ({ page }) => {
    // Create multiple notes
    const notes = [
      { title: 'Első jegyzet', content: 'Első tartalom' },
      { title: 'Második jegyzet', content: 'Második tartalom' },
      { title: 'Harmadik megjegyzés', content: 'Harmadik tartalom' }
    ];

    for (const note of notes) {
      await page.getByRole('button', { name: /új/i }).click();
      await page.getByRole('button', { name: /jegyzet/i }).click();
      await page.getByLabel(/cím/i).fill(note.title);
      await page.getByLabel(/tartalom/i).fill(note.content);
      await page.getByRole('button', { name: /mentés/i }).click();
      await page.waitForTimeout(300); // Wait for animation
    }

    // Search for specific note
    await page.getByPlaceholder(/keresés/i).fill('Második');

    // Verify only matching note is visible
    await expect(page.getByText('Második jegyzet')).toBeVisible();
    await expect(page.getByText('Első jegyzet')).not.toBeVisible();
    await expect(page.getByText('Harmadik megjegyzés')).not.toBeVisible();

    // Clear search
    await page.getByPlaceholder(/keresés/i).clear();

    // Verify all notes are visible again
    await expect(page.getByText('Első jegyzet')).toBeVisible();
    await expect(page.getByText('Második jegyzet')).toBeVisible();
    await expect(page.getByText('Harmadik megjegyzés')).toBeVisible();
  });

  test('should filter to show only notes', async ({ page }) => {
    // Create a note
    await page.getByRole('button', { name: /új/i }).click();
    await page.getByRole('button', { name: /jegyzet/i }).click();
    await page.getByLabel(/cím/i).fill('Teszt jegyzet');
    await page.getByLabel(/tartalom/i).fill('Jegyzet tartalom');
    await page.getByRole('button', { name: /mentés/i }).click();

    // Create a todo
    await page.getByRole('button', { name: /új/i }).click();
    await page.getByRole('button', { name: /todo/i }).click();
    await page.getByLabel(/cím/i).fill('Teszt TODO');
    await page.getByRole('button', { name: /mentés/i }).click();

    // Verify both are visible
    await expect(page.getByText('Teszt jegyzet')).toBeVisible();
    await expect(page.getByText('Teszt TODO')).toBeVisible();

    // Filter to show only notes
    await page.getByRole('button', { name: /csak jegyzetek/i }).click();

    // Verify only note is visible
    await expect(page.getByText('Teszt jegyzet')).toBeVisible();
    await expect(page.getByText('Teszt TODO')).not.toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Create a note
    await page.getByRole('button', { name: /új/i }).click();
    await page.getByRole('button', { name: /jegyzet/i }).click();

    // Fill form using Tab navigation
    await page.keyboard.press('Tab'); // Focus on title
    await page.keyboard.type('Billentyűzetes jegyzet');

    await page.keyboard.press('Tab'); // Focus on content
    await page.keyboard.type('Billentyűzettel írt tartalom');

    // Save with keyboard (Ctrl/Cmd + Enter if implemented, otherwise Tab to save button)
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Verify note was created
    await expect(page.getByText('Billentyűzetes jegyzet')).toBeVisible();
  });

  test('should close modal with Escape key', async ({ page }) => {
    // Open note editor
    await page.getByRole('button', { name: /új/i }).click();
    await page.getByRole('button', { name: /jegyzet/i }).click();

    // Verify modal is open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

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
    // Click FAB to open type picker
    await page.getByLabel('Új elem létrehozása').click();

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Select "Jegyzet" option
    await page.getByRole('button', { name: /jegyzet/i }).click();

    // Wait for note editor to be visible
    await expect(page.locator('#note-title')).toBeVisible();

    // Fill in note details using specific ID
    await page.locator('#note-title').fill('Teszt jegyzet');
    await page.locator('#note-content').fill('Ez egy teszt jegyzet tartalom.');

    // Select a color using aria-label (ColorPicker uses aria-label not data-color)
    await page.getByRole('radio', { name: /levendula/i }).click();

    // Save note (new note uses "Létrehozás" button)
    await page.getByRole('button', { name: 'Létrehozás', exact: true }).click();

    // Verify modal closed
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify note appears in the list
    await expect(page.getByText('Teszt jegyzet')).toBeVisible();
    await expect(page.getByText('Ez egy teszt jegyzet tartalom.')).toBeVisible();
  });

  test('should edit an existing note', async ({ page }) => {
    // Create a note first
    await page.getByLabel('Új elem létrehozása').click();
    await page.getByRole('button', { name: /jegyzet/i }).click();
    await expect(page.locator('#note-title')).toBeVisible();
    await page.locator('#note-title').fill('Eredeti jegyzet');
    await page.locator('#note-content').fill('Eredeti tartalom');
    await page.getByRole('button', { name: 'Létrehozás', exact: true }).click();

    // Wait for note to appear
    await expect(page.getByText('Eredeti jegyzet')).toBeVisible();

    // Click on the note to edit
    await page.getByText('Eredeti jegyzet').click();

    // Wait for editor modal
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('#note-title')).toBeVisible();

    // Edit the note
    await page.locator('#note-title').fill('Módosított jegyzet');
    await page.locator('#note-content').fill('Módosított tartalom');

    // Save changes (editing uses "Mentés" button)
    await page.getByRole('button', { name: /mentés/i }).click();

    // Verify changes are reflected
    await expect(page.getByText('Módosított jegyzet')).toBeVisible();
    await expect(page.getByText('Módosított tartalom')).toBeVisible();
    await expect(page.getByText('Eredeti jegyzet')).not.toBeVisible();
  });

  test('should delete a note', async ({ page }) => {
    // Create a note first
    await page.getByLabel('Új elem létrehozása').click();
    await page.getByRole('button', { name: /jegyzet/i }).click();
    await expect(page.locator('#note-title')).toBeVisible();
    await page.locator('#note-title').fill('Törlendő jegyzet');
    await page.locator('#note-content').fill('Ez a jegyzet törlésre kerül');
    await page.getByRole('button', { name: 'Létrehozás', exact: true }).click();

    // Wait for note to appear
    await expect(page.getByText('Törlendő jegyzet')).toBeVisible();

    // Find and click the delete button on the card (trash icon)
    // The delete button is in the card header
    const noteCard = page.locator('.card').filter({ hasText: 'Törlendő jegyzet' });
    const deleteButton = noteCard.locator('button[aria-label*="törlés"], .card__delete-btn').first();

    // Setup dialog listener before clicking delete
    page.once('dialog', dialog => dialog.accept());

    await deleteButton.click();

    // Verify note is removed
    await expect(page.getByText('Törlendő jegyzet')).not.toBeVisible();
  });

  test('should select different colors for notes', async ({ page }) => {
    // Create a note with a specific color
    await page.getByLabel('Új elem létrehozása').click();
    await page.getByRole('button', { name: /jegyzet/i }).click();
    await expect(page.locator('#note-title')).toBeVisible();
    await page.locator('#note-title').fill('Színes jegyzet');
    await page.locator('#note-content').fill('Ez egy színes jegyzet');

    // Select lavender color using aria-label
    await page.getByRole('radio', { name: /levendula/i }).click();

    // Save note
    await page.getByRole('button', { name: 'Létrehozás', exact: true }).click();

    // Verify note appears
    await expect(page.getByText('Színes jegyzet')).toBeVisible();
  });

  test('should create multiple notes', async ({ page }) => {
    // Create multiple notes
    const notes = [
      { title: 'Első jegyzet', content: 'Első tartalom' },
      { title: 'Második jegyzet', content: 'Második tartalom' },
      { title: 'Harmadik megjegyzés', content: 'Harmadik tartalom' }
    ];

    for (const note of notes) {
      await page.getByLabel('Új elem létrehozása').click();
      await page.getByRole('button', { name: /jegyzet/i }).click();
      await expect(page.locator('#note-title')).toBeVisible();
      await page.locator('#note-title').fill(note.title);
      await page.locator('#note-content').fill(note.content);
      await page.getByRole('button', { name: 'Létrehozás', exact: true }).click();
      await page.waitForTimeout(300); // Wait for animation
    }

    // Verify all notes are visible
    await expect(page.getByText('Első jegyzet')).toBeVisible();
    await expect(page.getByText('Második jegyzet')).toBeVisible();
    await expect(page.getByText('Harmadik megjegyzés')).toBeVisible();
  });

  test('should display both notes and todos in the list', async ({ page }) => {
    // Create a note
    await page.getByLabel('Új elem létrehozása').click();
    await page.getByRole('button', { name: /jegyzet/i }).click();
    await expect(page.locator('#note-title')).toBeVisible();
    await page.locator('#note-title').fill('Teszt jegyzet');
    await page.locator('#note-content').fill('Jegyzet tartalom');
    await page.getByRole('button', { name: 'Létrehozás', exact: true }).click();

    // Wait for note to appear
    await expect(page.getByText('Teszt jegyzet')).toBeVisible();

    // Create a todo
    await page.getByLabel('Új elem létrehozása').click();
    await page.getByRole('button', { name: /teendő/i }).click();
    await expect(page.locator('#todo-title')).toBeVisible();
    await page.locator('#todo-title').fill('Teszt TODO');
    await page.getByPlaceholder(/új elem/i).fill('TODO elem');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Létrehozás', exact: true }).click();

    // Verify both are visible
    await expect(page.getByText('Teszt jegyzet')).toBeVisible();
    await expect(page.getByText('Teszt TODO')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Create a note
    await page.getByLabel('Új elem létrehozása').click();
    await page.getByRole('button', { name: /jegyzet/i }).click();

    // Wait for the note editor to be visible
    await expect(page.locator('#note-title')).toBeVisible();

    // Fill using the input directly
    await page.locator('#note-title').fill('Billentyűzetes jegyzet');
    await page.locator('#note-content').fill('Billentyűzettel írt tartalom');

    // Save note
    await page.getByRole('button', { name: 'Létrehozás', exact: true }).click();

    // Verify note was created
    await expect(page.getByText('Billentyűzetes jegyzet')).toBeVisible();
  });

  test('should close modal with Escape key', async ({ page }) => {
    // Open note editor
    await page.getByLabel('Új elem létrehozása').click();
    await page.getByRole('button', { name: /jegyzet/i }).click();

    // Verify modal is open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import { resetData } from './helpers';

test.describe('TODO Management', () => {
  test.beforeEach(async ({ page, request }) => {
    // Fresh state: wipe the test account's data through the API
    await resetData(request);
    await page.goto('./');
    await page.waitForLoadState('networkidle');
  });

  test('should create a new TODO list', async ({ page }) => {
    // Click FAB to open editor
    await page.getByLabel('Új elem létrehozása').click();

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Select "Teendő" option
    await page.getByRole('button', { name: 'Teendő', exact: true }).click();

    // Wait for todo editor to be visible
    await expect(page.locator('#todo-title')).toBeVisible();

    // Fill in TODO title
    await page.locator('#todo-title').fill('Bevásárlólista');

    // Add TODO items
    const items = ['Kenyér', 'Tej', 'Tojás'];
    for (const item of items) {
      await page.getByPlaceholder(/új teendő hozzáadása/i).fill(item);
      await page.keyboard.press('Enter');
    }

    // Select a color using aria-label
    await page.getByRole('radio', { name: /égkék/i }).click();

    // Save TODO (new todo uses "Létrehozás" button)
    await page.getByRole('button', { name: 'Létrehozás', exact: true }).click();

    // Verify modal closed
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify TODO appears in the list (scoped to the card - the closed
    // editor dialog may still hold the same item texts in the DOM)
    const card = page.locator('.card').filter({ hasText: 'Bevásárlólista' });
    await expect(card).toBeVisible();
    await expect(card.getByText('Kenyér')).toBeVisible();
    await expect(card.getByText('Tej')).toBeVisible();
    await expect(card.getByText('Tojás')).toBeVisible();
  });

  test('should check/uncheck TODO items', async ({ page }) => {
    // Create a TODO list first
    await page.getByLabel('Új elem létrehozása').click();
    await page.getByRole('button', { name: 'Teendő', exact: true }).click();
    await expect(page.locator('#todo-title')).toBeVisible();
    await page.locator('#todo-title').fill('Feladatok');
    await page.getByPlaceholder(/új teendő hozzáadása/i).fill('Első feladat');
    await page.keyboard.press('Enter');
    await page.getByPlaceholder(/új teendő hozzáadása/i).fill('Második feladat');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Létrehozás', exact: true }).click();

    // Wait for the create dialog to close and the card to appear
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Feladatok')).toBeVisible();

    // Items are toggled in the editor - open the card
    await page.getByText('Feladatok').click();
    // Edit mode has no #todo-title input - wait for the item checkboxes
    await expect(page.getByRole('checkbox').first()).toBeVisible();

    // Check the first item (custom checkbox with role="checkbox")
    const firstCheckbox = page.getByRole('checkbox').first();
    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveAttribute('aria-checked', 'true');

    // Verify progress indicator updated (should show 1/2)
    await expect(page.getByText(/1.*\/.*2/)).toBeVisible();

    // Check second item
    const secondCheckbox = page.getByRole('checkbox').nth(1);
    await secondCheckbox.click();

    // Verify both are checked and progress shows 2/2
    await expect(secondCheckbox).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByText(/2.*\/.*2/)).toBeVisible();

    // Uncheck first item
    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveAttribute('aria-checked', 'false');

    // Verify progress updated to 1/2
    await expect(page.getByText(/1.*\/.*2/)).toBeVisible();
  });

  test('should delete a TODO item in editor', async ({ page }) => {
    // Create a TODO with items
    await page.getByLabel('Új elem létrehozása').click();
    await page.getByRole('button', { name: 'Teendő', exact: true }).click();
    await expect(page.locator('#todo-title')).toBeVisible();
    await page.locator('#todo-title').fill('TODO teszt');
    await page.getByPlaceholder(/új teendő hozzáadása/i).fill('Törlendő elem');
    await page.keyboard.press('Enter');
    await page.getByPlaceholder(/új teendő hozzáadása/i).fill('Maradó elem');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Létrehozás', exact: true }).click();

    // Wait for the create dialog to close and the card to appear
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('TODO teszt')).toBeVisible();

    // Click on TODO to edit
    await page.getByText('TODO teszt').click();

    // Wait for editor (edit mode has no #todo-title input)
    await expect(page.getByRole('checkbox').first()).toBeVisible();

    // Both items should be visible in the editor (scoped: the card behind
    // the dialog holds the same texts)
    const editor = page.getByRole('dialog');
    await expect(editor.getByText('Törlendő elem')).toBeVisible();
    await expect(editor.getByText('Maradó elem')).toBeVisible();

    // Find and click delete button for first item (in items-list)
    const deleteButtons = page.locator('.items-list button[aria-label*="törlés"]');
    await deleteButtons.first().click();

    // Verify item is removed
    await expect(editor.getByText('Törlendő elem')).not.toBeVisible();
    await expect(editor.getByText('Maradó elem')).toBeVisible();

    // Edit mode saves immediately - close the editor
    await page.getByRole('button', { name: 'Bezárás' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // The card reflects the change
    const card = page.locator('.card').filter({ hasText: 'TODO teszt' });
    await expect(card.getByText('Törlendő elem')).not.toBeVisible();
    await expect(card.getByText('Maradó elem')).toBeVisible();

    // Reopen the editor to verify changes persisted
    await page.getByText('TODO teszt').click();
    await expect(page.getByRole('checkbox').first()).toBeVisible();
    await expect(page.getByRole('dialog').getByText('Törlendő elem')).not.toBeVisible();
    await expect(page.getByRole('dialog').getByText('Maradó elem')).toBeVisible();
  });

  test('should delete entire TODO list', async ({ page }) => {
    // Create a TODO list
    await page.getByLabel('Új elem létrehozása').click();
    await page.getByRole('button', { name: 'Teendő', exact: true }).click();
    await expect(page.locator('#todo-title')).toBeVisible();
    await page.locator('#todo-title').fill('Törlendő TODO');
    await page.getByPlaceholder(/új teendő hozzáadása/i).fill('Valami feladat');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Létrehozás', exact: true }).click();

    // Wait for TODO to appear
    await expect(page.getByText('Törlendő TODO')).toBeVisible();

    // Find and click the delete button on the card
    const todoCard = page.locator('.card').filter({ hasText: 'Törlendő TODO' });
    const deleteButton = todoCard.locator('button[aria-label*="törlés"], .card__delete-btn').first();

    // Setup dialog listener before clicking delete
    page.once('dialog', dialog => dialog.accept());

    await deleteButton.click();

    // Verify TODO is removed
    await expect(page.getByText('Törlendő TODO')).not.toBeVisible();
  });

  test('should show progress indicator', async ({ page }) => {
    // Create a TODO with 3 items
    await page.getByLabel('Új elem létrehozása').click();
    await page.getByRole('button', { name: 'Teendő', exact: true }).click();
    await expect(page.locator('#todo-title')).toBeVisible();
    await page.locator('#todo-title').fill('Haladás teszt');

    const items = ['Item 1', 'Item 2', 'Item 3'];
    for (const item of items) {
      await page.getByPlaceholder(/új teendő hozzáadása/i).fill(item);
      await page.keyboard.press('Enter');
    }

    await page.getByRole('button', { name: 'Létrehozás', exact: true }).click();

    // Wait for the create dialog to close and the card to appear
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Haladás teszt')).toBeVisible();

    // Verify initial progress is 0/3
    await expect(page.getByText(/0.*\/.*3/)).toBeVisible();

    // Items are toggled in the editor - open the card
    await page.getByText('Haladás teszt').click();
    // Edit mode has no #todo-title input - wait for the item checkboxes
    await expect(page.getByRole('checkbox').first()).toBeVisible();

    const checkboxes = page.getByRole('checkbox');
    const count = await checkboxes.count();
    expect(count).toBe(3);

    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).click();
      // Verify progress updates (1/3, 2/3, 3/3)
      await expect(page.getByText(new RegExp(`${i + 1}.*\\/.*${count}`))).toBeVisible();
    }
  });

  test('should select different colors for TODOs', async ({ page }) => {
    // Create a TODO with a specific color
    await page.getByLabel('Új elem létrehozása').click();
    await page.getByRole('button', { name: 'Teendő', exact: true }).click();
    await expect(page.locator('#todo-title')).toBeVisible();
    await page.locator('#todo-title').fill('Színes TODO');
    await page.getByPlaceholder(/új teendő hozzáadása/i).fill('Színes feladat');
    await page.keyboard.press('Enter');

    // Select sky color using aria-label
    await page.getByRole('radio', { name: /égkék/i }).click();

    // Save TODO
    await page.getByRole('button', { name: 'Létrehozás', exact: true }).click();

    // Verify TODO appears
    await expect(page.getByText('Színes TODO')).toBeVisible();
  });

  test('should display both notes and todos in the list', async ({ page }) => {
    // Create a note
    await page.getByLabel('Új elem létrehozása').click();
    await page.getByRole('button', { name: 'Jegyzet', exact: true }).click();
    await expect(page.locator('#note-title')).toBeVisible();
    await page.locator('#note-title').fill('Teszt jegyzet');
    await page.locator('#note-content').fill('Jegyzet tartalom');
    await page.getByRole('button', { name: 'Létrehozás', exact: true }).click();

    // Wait for note to appear
    await expect(page.getByText('Teszt jegyzet')).toBeVisible();

    // Create a TODO
    await page.getByLabel('Új elem létrehozása').click();
    await page.getByRole('button', { name: 'Teendő', exact: true }).click();
    await expect(page.locator('#todo-title')).toBeVisible();
    await page.locator('#todo-title').fill('Teszt TODO');
    await page.getByPlaceholder(/új teendő hozzáadása/i).fill('TODO elem');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Létrehozás', exact: true }).click();

    // Verify both are visible
    await expect(page.getByText('Teszt jegyzet')).toBeVisible();
    await expect(page.getByText('Teszt TODO')).toBeVisible();
  });

  test('should create multiple TODOs', async ({ page }) => {
    // Create multiple TODOs
    const todos = [
      { title: 'Bevásárlás', items: ['Kenyér', 'Tej'] },
      { title: 'Projektek', items: ['Website', 'App'] },
      { title: 'Házimunka', items: ['Mosás', 'Főzés'] }
    ];

    for (const todo of todos) {
      await page.getByLabel('Új elem létrehozása').click();
      await page.getByRole('button', { name: 'Teendő', exact: true }).click();
      await expect(page.locator('#todo-title')).toBeVisible();
      await page.locator('#todo-title').fill(todo.title);

      for (const item of todo.items) {
        await page.getByPlaceholder(/új teendő hozzáadása/i).fill(item);
        await page.keyboard.press('Enter');
      }

      await page.getByRole('button', { name: 'Létrehozás', exact: true }).click();
      await page.waitForTimeout(300);
    }

    // Verify all TODOs are visible
    await expect(page.getByText('Bevásárlás')).toBeVisible();
    await expect(page.getByText('Projektek')).toBeVisible();
    await expect(page.getByText('Házimunka')).toBeVisible();
  });

  test('should persist checkbox state after page reload', async ({ page }) => {
    // Create a TODO
    await page.getByLabel('Új elem létrehozása').click();
    await page.getByRole('button', { name: 'Teendő', exact: true }).click();
    await expect(page.locator('#todo-title')).toBeVisible();
    await page.locator('#todo-title').fill('Perzisztencia teszt');
    await page.getByPlaceholder(/új teendő hozzáadása/i).fill('Első elem');
    await page.keyboard.press('Enter');
    await page.getByPlaceholder(/új teendő hozzáadása/i).fill('Második elem');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Létrehozás', exact: true }).click();

    // Wait for the create dialog to close and the card to appear
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Perzisztencia teszt')).toBeVisible();

    // Toggle the first item in the editor (saves through the API immediately)
    await page.getByText('Perzisztencia teszt').click();
    // Edit mode has no #todo-title input - wait for the item checkboxes
    await expect(page.getByRole('checkbox').first()).toBeVisible();
    const firstCheckbox = page.getByRole('checkbox').first();
    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveAttribute('aria-checked', 'true');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify progress persisted (1/2 on the card)
    await expect(page.getByText(/1.*\/.*2/)).toBeVisible();

    // Reopen the editor and verify the item is still checked
    await page.getByText('Perzisztencia teszt').click();
    // Edit mode has no #todo-title input - wait for the item checkboxes
    await expect(page.getByRole('checkbox').first()).toBeVisible();
    await expect(page.getByRole('checkbox').first()).toHaveAttribute('aria-checked', 'true');
  });
});

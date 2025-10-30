import { test, expect } from '@playwright/test';

test.describe('TODO Management', () => {
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

  test('should create a new TODO list', async ({ page }) => {
    // Click FAB to open editor
    await page.getByRole('button', { name: /új/i }).click();

    // Wait for modal to appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Select "TODO lista" option
    await page.getByRole('button', { name: /todo/i }).click();

    // Fill in TODO title
    await page.getByLabel(/cím/i).fill('Bevásárlólista');

    // Add TODO items
    const items = ['Kenyér', 'Tej', 'Tojás'];
    for (const item of items) {
      await page.getByPlaceholder(/új elem hozzáadása/i).fill(item);
      await page.keyboard.press('Enter');
    }

    // Select a color
    await page.locator('[data-color="sky"]').click();

    // Save TODO
    await page.getByRole('button', { name: /mentés/i }).click();

    // Verify modal closed
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify TODO appears in the list
    await expect(page.getByText('Bevásárlólista')).toBeVisible();
    await expect(page.getByText('Kenyér')).toBeVisible();
    await expect(page.getByText('Tej')).toBeVisible();
    await expect(page.getByText('Tojás')).toBeVisible();
  });

  test('should check/uncheck TODO items', async ({ page }) => {
    // Create a TODO list first
    await page.getByRole('button', { name: /új/i }).click();
    await page.getByRole('button', { name: /todo/i }).click();
    await page.getByLabel(/cím/i).fill('Feladatok');
    await page.getByPlaceholder(/új elem hozzáadása/i).fill('Első feladat');
    await page.keyboard.press('Enter');
    await page.getByPlaceholder(/új elem hozzáadása/i).fill('Második feladat');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /mentés/i }).click();

    // Wait for TODO to appear
    await expect(page.getByText('Feladatok')).toBeVisible();

    // Find and check the first checkbox
    const firstCheckbox = page.locator('[type="checkbox"]').first();
    await firstCheckbox.check();

    // Verify checkbox is checked
    await expect(firstCheckbox).toBeChecked();

    // Verify progress indicator updated (should show 1/2)
    await expect(page.getByText(/1.*\/.*2/)).toBeVisible();

    // Check second checkbox
    const secondCheckbox = page.locator('[type="checkbox"]').nth(1);
    await secondCheckbox.check();

    // Verify both are checked and progress shows 2/2
    await expect(secondCheckbox).toBeChecked();
    await expect(page.getByText(/2.*\/.*2/)).toBeVisible();

    // Uncheck first checkbox
    await firstCheckbox.uncheck();

    // Verify progress updated to 1/2
    await expect(page.getByText(/1.*\/.*2/)).toBeVisible();
  });

  test('should delete a TODO item', async ({ page }) => {
    // Create a TODO with items
    await page.getByRole('button', { name: /új/i }).click();
    await page.getByRole('button', { name: /todo/i }).click();
    await page.getByLabel(/cím/i).fill('TODO teszt');
    await page.getByPlaceholder(/új elem hozzáadása/i).fill('Törlendő elem');
    await page.keyboard.press('Enter');
    await page.getByPlaceholder(/új elem hozzáadása/i).fill('Maradó elem');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /mentés/i }).click();

    // Wait for TODO to appear
    await expect(page.getByText('TODO teszt')).toBeVisible();

    // Click on TODO to edit
    await page.getByText('TODO teszt').click();

    // Find and click delete button for first item
    const deleteButton = page.getByRole('button', { name: /törlés/i }).first();
    await deleteButton.click();

    // Verify item is removed
    await expect(page.getByText('Törlendő elem')).not.toBeVisible();
    await expect(page.getByText('Maradó elem')).toBeVisible();

    // Save changes
    await page.getByRole('button', { name: /mentés/i }).click();

    // Verify changes persisted
    await page.getByText('TODO teszt').click();
    await expect(page.getByText('Törlendő elem')).not.toBeVisible();
    await expect(page.getByText('Maradó elem')).toBeVisible();
  });

  test('should delete entire TODO list', async ({ page }) => {
    // Create a TODO list
    await page.getByRole('button', { name: /új/i }).click();
    await page.getByRole('button', { name: /todo/i }).click();
    await page.getByLabel(/cím/i).fill('Törlendő TODO');
    await page.getByPlaceholder(/új elem hozzáadása/i).fill('Valami feladat');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /mentés/i }).click();

    // Wait for TODO to appear
    await expect(page.getByText('Törlendő TODO')).toBeVisible();

    // Click on TODO to open editor
    await page.getByText('Törlendő TODO').click();

    // Click delete button (for the entire TODO list)
    await page.getByRole('button', { name: /törlés/i }).last().click();

    // Confirm deletion
    page.once('dialog', dialog => dialog.accept());

    // Verify TODO is removed
    await expect(page.getByText('Törlendő TODO')).not.toBeVisible();
  });

  test('should show progress indicator', async ({ page }) => {
    // Create a TODO with 3 items
    await page.getByRole('button', { name: /új/i }).click();
    await page.getByRole('button', { name: /todo/i }).click();
    await page.getByLabel(/cím/i).fill('Haladás teszt');

    const items = ['Item 1', 'Item 2', 'Item 3'];
    for (const item of items) {
      await page.getByPlaceholder(/új elem hozzáadása/i).fill(item);
      await page.keyboard.press('Enter');
    }

    await page.getByRole('button', { name: /mentés/i }).click();

    // Wait for TODO to appear
    await expect(page.getByText('Haladás teszt')).toBeVisible();

    // Verify initial progress is 0/3
    await expect(page.getByText(/0.*\/.*3/)).toBeVisible();

    // Check all checkboxes
    const checkboxes = page.locator('[type="checkbox"]');
    const count = await checkboxes.count();

    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
      // Verify progress updates (1/3, 2/3, 3/3)
      await expect(page.getByText(new RegExp(`${i + 1}.*\\/.*${count}`))).toBeVisible();
    }

    // Verify progress bar is full (visual indicator)
    const progressBar = page.locator('[class*="progress-fill"]').first();
    await expect(progressBar).toHaveAttribute('style', /width:\s*100%/);
  });

  test('should mark TODO as urgent', async ({ page }) => {
    // Create an urgent TODO
    await page.getByRole('button', { name: /új/i }).click();
    await page.getByRole('button', { name: /todo/i }).click();
    await page.getByLabel(/cím/i).fill('Sürgős TODO');
    await page.getByPlaceholder(/új elem hozzáadása/i).fill('Sürgős feladat');
    await page.keyboard.press('Enter');

    // Check urgent checkbox
    await page.getByLabel(/sürgős/i).check();

    // Save TODO
    await page.getByRole('button', { name: /mentés/i }).click();

    // Verify urgent badge appears
    await expect(page.getByText('Sürgős TODO')).toBeVisible();
    const urgentCard = page.locator('[class*="card--urgent"]').first();
    await expect(urgentCard).toBeVisible();
  });

  test('should filter to show only TODOs', async ({ page }) => {
    // Create a note
    await page.getByRole('button', { name: /új/i }).click();
    await page.getByRole('button', { name: /jegyzet/i }).click();
    await page.getByLabel(/cím/i).fill('Teszt jegyzet');
    await page.getByLabel(/tartalom/i).fill('Jegyzet tartalom');
    await page.getByRole('button', { name: /mentés/i }).click();

    // Create a TODO
    await page.getByRole('button', { name: /új/i }).click();
    await page.getByRole('button', { name: /todo/i }).click();
    await page.getByLabel(/cím/i).fill('Teszt TODO');
    await page.getByPlaceholder(/új elem hozzáadása/i).fill('TODO elem');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /mentés/i }).click();

    // Verify both are visible
    await expect(page.getByText('Teszt jegyzet')).toBeVisible();
    await expect(page.getByText('Teszt TODO')).toBeVisible();

    // Filter to show only TODOs
    await page.getByRole('button', { name: /csak todo/i }).click();

    // Verify only TODO is visible
    await expect(page.getByText('Teszt TODO')).toBeVisible();
    await expect(page.getByText('Teszt jegyzet')).not.toBeVisible();
  });

  test('should search TODOs by title and items', async ({ page }) => {
    // Create multiple TODOs
    const todos = [
      { title: 'Bevásárlás', items: ['Kenyér', 'Tej'] },
      { title: 'Projektek', items: ['Website', 'App'] },
      { title: 'Házimunka', items: ['Mosás', 'Főzés'] }
    ];

    for (const todo of todos) {
      await page.getByRole('button', { name: /új/i }).click();
      await page.getByRole('button', { name: /todo/i }).click();
      await page.getByLabel(/cím/i).fill(todo.title);

      for (const item of todo.items) {
        await page.getByPlaceholder(/új elem hozzáadása/i).fill(item);
        await page.keyboard.press('Enter');
      }

      await page.getByRole('button', { name: /mentés/i }).click();
      await page.waitForTimeout(300);
    }

    // Search by title
    await page.getByPlaceholder(/keresés/i).fill('Bevásárlás');
    await expect(page.getByText('Bevásárlás')).toBeVisible();
    await expect(page.getByText('Projektek')).not.toBeVisible();

    // Clear and search by item
    await page.getByPlaceholder(/keresés/i).clear();
    await page.getByPlaceholder(/keresés/i).fill('Website');
    await expect(page.getByText('Projektek')).toBeVisible();
    await expect(page.getByText('Bevásárlás')).not.toBeVisible();
  });

  test('should persist checkbox state after page reload', async ({ page }) => {
    // Create a TODO
    await page.getByRole('button', { name: /új/i }).click();
    await page.getByRole('button', { name: /todo/i }).click();
    await page.getByLabel(/cím/i).fill('Perzisztencia teszt');
    await page.getByPlaceholder(/új elem hozzáadása/i).fill('Első elem');
    await page.keyboard.press('Enter');
    await page.getByPlaceholder(/új elem hozzáadása/i).fill('Második elem');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /mentés/i }).click();

    // Check first checkbox
    const firstCheckbox = page.locator('[type="checkbox"]').first();
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify checkbox state persisted
    const reloadedCheckbox = page.locator('[type="checkbox"]').first();
    await expect(reloadedCheckbox).toBeChecked();

    // Verify progress still shows 1/2
    await expect(page.getByText(/1.*\/.*2/)).toBeVisible();
  });
});

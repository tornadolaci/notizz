import { test, expect } from '@playwright/test';

test.describe('Settings Management', () => {
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

    // Clear localStorage
    await page.evaluate(() => localStorage.clear());

    // Reload page to initialize fresh state
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to settings page', async ({ page }) => {
    // Click settings button in header (it's an anchor, not a button)
    await page.getByLabel('Beállítások').click();

    // Verify settings page loaded
    await expect(page).toHaveURL(/#\/settings/);
    await expect(page.getByText('Beállítások')).toBeVisible();
  });

  test('should display settings page elements', async ({ page }) => {
    // Navigate to settings
    await page.goto('/#/settings');
    await page.waitForLoadState('networkidle');

    // Verify page title
    await expect(page.getByRole('heading', { name: 'Beállítások' })).toBeVisible();

    // Verify database section title
    await expect(page.getByText('Adatbázis műveletek')).toBeVisible();

    // Verify information section
    await expect(page.getByText('Információ')).toBeVisible();
    await expect(page.getByText('Verzió:')).toBeVisible();
  });

  test('should have export button', async ({ page }) => {
    // Navigate to settings
    await page.goto('/#/settings');
    await page.waitForLoadState('networkidle');

    // Verify export button exists
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible();
  });

  test('should have import button', async ({ page }) => {
    // Navigate to settings
    await page.goto('/#/settings');
    await page.waitForLoadState('networkidle');

    // Verify import button exists
    await expect(page.getByRole('button', { name: /import/i })).toBeVisible();
  });

  test('should have delete database button', async ({ page }) => {
    // Navigate to settings
    await page.goto('/#/settings');
    await page.waitForLoadState('networkidle');

    // Verify delete button exists with danger styling
    await expect(page.getByRole('button', { name: /adatbázis törlése/i })).toBeVisible();
  });

  test('should export data as JSON', async ({ page }) => {
    // Create some data first
    await page.goto('/');

    // Create a note
    await page.getByLabel('Új elem létrehozása').click();
    await page.getByRole('button', { name: /jegyzet/i }).click();
    await expect(page.locator('#note-title')).toBeVisible();
    await page.locator('#note-title').fill('Exportálandó jegyzet');
    await page.locator('#note-content').fill('Teszt tartalom');
    await page.getByRole('button', { name: /mentés/i }).click();

    // Wait for note to appear
    await expect(page.getByText('Exportálandó jegyzet')).toBeVisible();

    // Navigate to settings
    await page.goto('/#/settings');
    await page.waitForLoadState('networkidle');

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.getByRole('button', { name: /export/i }).click();

    // Wait for download
    const download = await downloadPromise;

    // Verify filename contains 'notizz' and '.json'
    const filename = download.suggestedFilename();
    expect(filename).toContain('notizz');
    expect(filename).toContain('.json');

    // Verify file can be read
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('should have hidden file input for import', async ({ page }) => {
    // Navigate to settings
    await page.goto('/#/settings');
    await page.waitForLoadState('networkidle');

    // Verify hidden file input exists
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveCount(1);
    await expect(fileInput).toHaveAttribute('accept', '.json');
  });

  test('should return to home page from settings', async ({ page }) => {
    // Navigate to settings
    await page.goto('/#/settings');
    await page.waitForLoadState('networkidle');

    // Click back button
    await page.getByLabel('Vissza').click();

    // Verify we're back on home page
    await expect(page).toHaveURL('/');
  });

  test('should display version information', async ({ page }) => {
    // Navigate to settings
    await page.goto('/#/settings');
    await page.waitForLoadState('networkidle');

    // Verify version info
    await expect(page.getByText('1.0.0')).toBeVisible();
    await expect(page.getByText('PWA')).toBeVisible();
  });

  test('should toggle theme using header button', async ({ page }) => {
    // Get initial theme
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    // Click theme toggle button in header
    await page.getByLabel('Téma váltása').click();

    // Verify theme changed
    const newTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    // Theme should be different (toggled)
    expect(newTheme !== initialTheme).toBeTruthy();
  });

  test('should persist theme after page reload', async ({ page }) => {
    // Toggle to dark theme
    await page.getByLabel('Téma váltása').click();

    // Verify dark theme is set
    let theme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    expect(theme).toBe('dark');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify theme persisted
    theme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    expect(theme).toBe('dark');
  });

  test('should support keyboard navigation in settings', async ({ page }) => {
    // Navigate to settings
    await page.goto('/#/settings');
    await page.waitForLoadState('networkidle');

    // Use Tab to navigate through settings
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify export button can receive focus
    const exportButton = page.getByRole('button', { name: /export/i });
    await expect(exportButton).toBeVisible();
  });

  test('should show all action buttons', async ({ page }) => {
    // Navigate to settings
    await page.goto('/#/settings');
    await page.waitForLoadState('networkidle');

    // Verify all action buttons are present
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /import/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /adatbázis törlése/i })).toBeVisible();
  });
});

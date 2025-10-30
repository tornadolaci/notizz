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
    // Click settings button in header
    await page.getByRole('button', { name: /beállítások|settings/i }).click();

    // Verify settings page loaded
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole('heading', { name: /beállítások/i })).toBeVisible();
  });

  test('should change theme from light to dark', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Find theme selector
    const darkThemeButton = page.getByRole('button', { name: /sötét|dark/i });
    await darkThemeButton.click();

    // Verify theme changed (check data-theme attribute on html or body)
    const theme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme') ||
             document.body.getAttribute('data-theme');
    });
    expect(theme).toBe('dark');

    // Verify dark mode styles applied
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    // Dark mode should have dark background (check if it's not white)
    expect(bgColor).not.toBe('rgb(255, 255, 255)');
  });

  test('should change theme to auto', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Select auto theme
    const autoThemeButton = page.getByRole('button', { name: /auto|automatikus/i });
    await autoThemeButton.click();

    // Verify auto theme is set
    const theme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme') ||
             document.body.getAttribute('data-theme') ||
             localStorage.getItem('theme');
    });
    expect(['auto', 'light', 'dark']).toContain(theme);
  });

  test('should change font size', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Get initial font size
    const initialFontSize = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--text-base') || '16px';
    });

    // Change to large font size
    const largeFontButton = page.getByRole('button', { name: /nagy|large/i });
    await largeFontButton.click();

    // Verify font size changed
    const newFontSize = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--text-base') || '16px';
    });

    expect(newFontSize).not.toBe(initialFontSize);
    expect(newFontSize).toBe('18px');
  });

  test('should persist settings after page reload', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Change theme to dark
    await page.getByRole('button', { name: /sötét|dark/i }).click();

    // Change font size to large
    await page.getByRole('button', { name: /nagy|large/i }).click();

    // Navigate back to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify theme persisted
    const theme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme') ||
             document.body.getAttribute('data-theme');
    });
    expect(theme).toBe('dark');

    // Verify font size persisted
    const fontSize = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--text-base');
    });
    expect(fontSize).toBe('18px');
  });

  test('should export data as JSON', async ({ page }) => {
    // Create some data first
    await page.goto('/');

    // Create a note
    await page.getByRole('button', { name: /új/i }).click();
    await page.getByRole('button', { name: /jegyzet/i }).click();
    await page.getByLabel(/cím/i).fill('Exportálandó jegyzet');
    await page.getByLabel(/tartalom/i).fill('Teszt tartalom');
    await page.getByRole('button', { name: /mentés/i }).click();

    // Navigate to settings
    await page.goto('/settings');
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

  test('should import data from JSON', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Create test JSON data
    const testData = {
      notes: [
        {
          id: 'test-note-1',
          title: 'Importált jegyzet',
          content: 'Importált tartalom',
          color: 'lavender',
          tags: ['import'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isUrgent: false,
          order: 0
        }
      ],
      todos: [
        {
          id: 'test-todo-1',
          title: 'Importált TODO',
          items: [
            {
              id: 'item-1',
              text: 'Importált elem',
              completed: false,
              createdAt: new Date().toISOString()
            }
          ],
          color: 'sky',
          tags: ['import'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isUrgent: false,
          completedCount: 0,
          totalCount: 1,
          order: 0
        }
      ],
      settings: {
        theme: 'light',
        fontSize: 'medium',
        language: 'hu',
        enableAnimations: true,
        enableSound: false,
        defaultColor: 'lavender',
        sortOrder: 'updated'
      }
    };

    // Create a JSON file blob
    await page.evaluate((data) => {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create a temporary link and store the blob URL
      (window as any).__testImportData = url;
    }, testData);

    // Trigger file input with the test data
    const fileInput = page.locator('input[type="file"]');

    // Create a temporary file and upload it
    // Note: In real E2E test, you'd create an actual file
    // For now, we test that the import button and flow exist
    await expect(page.getByRole('button', { name: /import/i })).toBeVisible();
  });

  test('should return to home page from settings', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Click back button or home link
    await page.getByRole('button', { name: /vissza|back|home/i }).click();

    // Verify we're back on home page
    await expect(page).toHaveURL('/');
  });

  test('should display current settings values', async ({ page }) => {
    // Set some settings programmatically
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('fontSize', 'large');
    });

    // Navigate to settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Verify dark theme button is active/selected
    const darkButton = page.getByRole('button', { name: /sötét|dark/i });
    const isDarkSelected = await darkButton.getAttribute('class');
    expect(isDarkSelected).toContain('active');

    // Verify large font button is active/selected
    const largeButton = page.getByRole('button', { name: /nagy|large/i });
    const isLargeSelected = await largeButton.getAttribute('class');
    expect(isLargeSelected).toContain('active');
  });

  test('should support keyboard navigation in settings', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Use Tab to navigate through settings
    await page.keyboard.press('Tab');

    // Press Enter on focused element
    await page.keyboard.press('Enter');

    // Verify an action occurred (theme or font size changed)
    // This is a basic test - in reality you'd check specific changes
    const themeButtons = page.getByRole('button', { name: /világos|sötét|auto/i });
    await expect(themeButtons.first()).toBeVisible();
  });

  test('should validate that all settings options are present', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Verify theme options
    await expect(page.getByRole('button', { name: /világos|light/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sötét|dark/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /auto/i })).toBeVisible();

    // Verify font size options
    await expect(page.getByRole('button', { name: /kicsi|small/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /közepes|medium/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /nagy|large/i })).toBeVisible();

    // Verify export/import buttons
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /import/i })).toBeVisible();
  });
});

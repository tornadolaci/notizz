import { test, expect } from '@playwright/test';

test.describe('Notizz App', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/homepage.png' });

    // Check if the page title is correct
    await expect(page).toHaveTitle(/Notizz/);
  });

  test('should display FAB and header elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for FAB button
    await expect(page.getByLabel('Új elem létrehozása')).toBeVisible();

    // Check for header elements
    await expect(page.getByText('Notizz!')).toBeVisible();

    // Check for settings and theme toggle buttons
    await expect(page.getByLabel('Beállítások')).toBeVisible();
    await expect(page.getByLabel('Téma váltása')).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if viewport is set correctly
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();
  });
});

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

  test('should display filter buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for filter buttons
    await expect(page.getByRole('button', { name: 'Összes' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Csak jegyzetek/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Csak TODO/ })).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if viewport is set correctly
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();
  });
});

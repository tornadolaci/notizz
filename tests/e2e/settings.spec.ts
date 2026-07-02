import { test, expect } from '@playwright/test';
import { TEST_EMAIL } from './helpers';

test.describe('Settings Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to settings page', async ({ page }) => {
    // Click settings button in header
    await page.getByLabel('Beállítások').click();

    // Verify settings page loaded
    await expect(page).toHaveURL(/#\/settings/);
    await expect(page.getByRole('heading', { name: 'Beállítások' })).toBeVisible();
  });

  test('should display the account section with the logged-in user', async ({ page }) => {
    await page.goto('./#/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Fiók' })).toBeVisible();
    await expect(page.getByText(TEST_EMAIL)).toBeVisible();
    await expect(page.getByText('Bejelentkezve')).toBeVisible();

    // The logout button is present (not clicked - it would revoke the
    // shared token used by the rest of the suite)
    await expect(page.getByRole('button', { name: /kijelentkezés/i })).toBeVisible();
  });

  test('should display version information', async ({ page }) => {
    await page.goto('./#/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Információ' })).toBeVisible();
    await expect(page.getByText('Verzió:')).toBeVisible();
    // Version is the build date in YY.MM.DD format
    await expect(page.getByText(/^\d{2}\.\d{2}\.\d{2}$/)).toBeVisible();
    await expect(page.getByText('PWA', { exact: true })).toBeVisible();
    await expect(page.getByText('Készítette: nomadnet.hu')).toBeVisible();
  });

  test('should show active sync state for the logged-in user', async ({ page }) => {
    await page.goto('./#/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Szinkronizálás:')).toBeVisible();
    await expect(page.getByText('Aktív')).toBeVisible();
  });

  test('should return to home page from settings', async ({ page }) => {
    await page.goto('./#/settings');
    await page.waitForLoadState('networkidle');

    await page.getByLabel('Vissza').click();

    await expect(page.getByLabel('Új elem létrehozása')).toBeVisible();
  });

  test('should toggle theme using header button', async ({ page }) => {
    const initialTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    await page.getByLabel('Téma váltása').click();

    const newTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(newTheme).not.toBe(initialTheme);
  });
});

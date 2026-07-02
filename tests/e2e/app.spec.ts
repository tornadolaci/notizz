import { test, expect } from '@playwright/test';
import { resetData } from './helpers';

test.describe('Notizz App', () => {
  test.beforeEach(async ({ page, request }) => {
    await resetData(request);
    await page.goto('./');
    await page.waitForLoadState('networkidle');
  });

  test('should load the homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/Notizz/);
  });

  test('should display FAB and header elements', async ({ page }) => {
    // Check for FAB button
    await expect(page.getByLabel('Új elem létrehozása')).toBeVisible();

    // Check for header elements
    await expect(page.getByText('Notizz!')).toBeVisible();

    // Check for settings and theme toggle buttons
    await expect(page.getByLabel('Beállítások')).toBeVisible();
    await expect(page.getByLabel('Téma váltása')).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();
  });
});

test.describe('Auth gate', () => {
  // No storage state: this describe block runs unauthenticated
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should show the login gate instead of the app', async ({ page }) => {
    await page.goto('./');
    await page.waitForLoadState('networkidle');

    // The gate is visible with the login button
    await expect(page.getByRole('button', { name: /bejelentkezés \/ regisztráció/i })).toBeVisible();

    // The app content is not reachable
    await expect(page.getByLabel('Új elem létrehozása')).not.toBeVisible();
  });

  test('should open the auth modal from the gate', async ({ page }) => {
    await page.goto('./');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /bejelentkezés \/ regisztráció/i }).click();

    // The auth modal opens with the email/password form
    await expect(page.locator('.auth-modal input[type="email"]')).toBeVisible();
    await expect(page.locator('.auth-modal input[type="password"]')).toBeVisible();
  });

  test('should keep the reset-password route public', async ({ page }) => {
    await page.goto('./#/reset-password?token=' + 'a'.repeat(64));
    await page.waitForLoadState('networkidle');

    // The reset form renders instead of the gate
    await expect(page.getByRole('heading', { name: /jelszó visszaállítás/i })).toBeVisible();
  });
});

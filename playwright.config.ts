import { defineConfig, devices } from '@playwright/test';

// The e2e suite runs against the real stack: vite dev server + local PHP API
// with MySQL (notizz_dev database). All tests share ONE verified test account
// (created by auth.setup.ts), so parallelism is disabled - concurrent tests
// would delete each other's data through the shared account.
const STORAGE_STATE = 'tests/e2e/.auth/state.json';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    // Dedicated port so a developer's own dev server on 5173 is untouched
    baseURL: 'http://localhost:5199/app/notizz/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup']
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'], storageState: STORAGE_STATE },
      dependencies: ['setup']
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'], storageState: STORAGE_STATE },
      dependencies: ['setup']
    }
  ],
  webServer: [
    {
      // Requires a running local MySQL with the notizz_dev database
      // (see server/README.md); health only returns 200 when the DB is up
      command: 'php -S localhost:8080 server/dev-router.php',
      url: 'http://localhost:8080/api/health',
      reuseExistingServer: true
    },
    {
      command: 'npm run dev -- --port 5199 --strictPort',
      url: 'http://localhost:5199/app/notizz/',
      reuseExistingServer: !process.env.CI
    }
  ]
});

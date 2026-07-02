import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { API_BASE, TEST_EMAIL, TEST_PASSWORD, STATE_PATH, TOKEN_PATH } from './helpers';

/**
 * Runs once before the browser projects: ensures the shared test account
 * exists and is verified, then saves a storage state with the auth token.
 */
setup('authenticate test user', async ({ request }) => {
  // Try to log in first - registration only happens on a fresh database
  let response = await request.post(`${API_BASE}/auth/login`, {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD }
  });

  if (!response.ok()) {
    await request.post(`${API_BASE}/auth/register`, {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD }
    });

    // The local mailer runs in 'log' mode (server/config.php) - fish the
    // verification token out of the mail log
    const mailLog = fs.readFileSync('server/mail.log', 'utf-8');
    const tokens = [...mailLog.matchAll(/verify-email\?token=([0-9a-f]{64})/g)];
    expect(tokens.length, 'verify token in server/mail.log').toBeGreaterThan(0);
    const verifyToken = tokens[tokens.length - 1][1];
    await request.get(`${API_BASE}/auth/verify-email?token=${verifyToken}`);

    response = await request.post(`${API_BASE}/auth/login`, {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD }
    });
  }

  expect(response.ok(), 'login with the test account').toBeTruthy();
  const { token } = (await response.json()) as { token: string };

  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(TOKEN_PATH, token);
  fs.writeFileSync(
    STATE_PATH,
    JSON.stringify(
      {
        cookies: [],
        origins: [
          {
            origin: 'http://localhost:5199',
            localStorage: [{ name: 'notizz_auth_token', value: token }]
          }
        ]
      },
      null,
      2
    )
  );
});

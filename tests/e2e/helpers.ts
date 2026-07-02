import type { APIRequestContext } from '@playwright/test';
import fs from 'fs';

export const API_BASE = 'http://localhost:8080/api';
export const TEST_EMAIL = 'e2e-playwright@example.com';
export const TEST_PASSWORD = 'e2eTitok123';
export const STATE_PATH = 'tests/e2e/.auth/state.json';
export const TOKEN_PATH = 'tests/e2e/.auth/token.txt';

function authHeaders(): Record<string, string> {
  const token = fs.readFileSync(TOKEN_PATH, 'utf-8').trim();
  // X-Auth-Token: same channel the app uses (Authorization also works locally)
  return { 'X-Auth-Token': token };
}

/**
 * Delete every note and todo of the shared test account so each test
 * starts from a clean slate (replaces the old IndexedDB wipe).
 */
export async function resetData(request: APIRequestContext): Promise<void> {
  const headers = authHeaders();
  for (const kind of ['notes', 'todos'] as const) {
    const response = await request.get(`${API_BASE}/${kind}`, { headers });
    const items = (await response.json()) as Array<{ id: string }>;
    for (const item of items) {
      await request.delete(`${API_BASE}/${kind}/${item.id}`, { headers });
    }
  }
}

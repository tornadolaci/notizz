/**
 * API Client Unit Tests
 * Covers token storage, request/error handling and the Hungarian error mapping.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  apiFetch,
  ApiError,
  getToken,
  setToken,
  clearToken,
  registerUnauthorizedHandler,
} from '../../../src/lib/api/client';
import {
  signInWithEmail,
  signUpWithEmail,
  getErrorMessage,
} from '../../../src/lib/api/auth.service';

function mockFetchResponse(status: number, body: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    })
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
  registerUnauthorizedHandler(() => {});
});

describe('token storage', () => {
  it('stores, returns and clears the token', () => {
    expect(getToken()).toBeNull();
    setToken('a'.repeat(64));
    expect(getToken()).toBe('a'.repeat(64));
    clearToken();
    expect(getToken()).toBeNull();
  });
});

describe('apiFetch', () => {
  it('returns parsed JSON on success', async () => {
    mockFetchResponse(200, { status: 'ok' });
    const result = await apiFetch<{ status: string }>('health');
    expect(result.status).toBe('ok');
  });

  it('sends the Bearer token when present', async () => {
    setToken('b'.repeat(64));
    mockFetchResponse(200, []);
    await apiFetch('notes');
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['Authorization']).toBe(`Bearer ${'b'.repeat(64)}`);
  });

  it('throws ApiError with the backend error code', async () => {
    mockFetchResponse(409, { error: 'email_taken' });
    await expect(apiFetch('auth/register', { method: 'POST', body: {}, auth: false })).rejects.toMatchObject({
      code: 'email_taken',
      status: 409,
    });
  });

  it('clears the token and notifies the handler on 401', async () => {
    setToken('c'.repeat(64));
    const handler = vi.fn();
    registerUnauthorizedHandler(handler);
    mockFetchResponse(401, { error: 'unauthorized' });

    await expect(apiFetch('auth/me')).rejects.toBeInstanceOf(ApiError);
    expect(getToken()).toBeNull();
    expect(handler).toHaveBeenCalledOnce();
  });

  it('maps network failure to a network_error ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(apiFetch('notes')).rejects.toMatchObject({
      code: 'network_error',
      status: 0,
    });
  });
});

describe('auth service', () => {
  it('signInWithEmail stores the token and returns the user', async () => {
    const token = 'd'.repeat(64);
    mockFetchResponse(200, {
      token,
      user: {
        id: '11111111-2222-4333-8444-555555555555',
        email: 'teszt@example.com',
        emailVerifiedAt: '2026-07-01T10:00:00.000Z',
        createdAt: '2026-07-01T09:00:00.000Z',
      },
    });

    const result = await signInWithEmail('teszt@example.com', 'titok123');

    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('teszt@example.com');
    expect(result.user?.createdAt).toBeInstanceOf(Date);
    expect(getToken()).toBe(token);
  });

  it('signInWithEmail maps invalid_credentials to Hungarian', async () => {
    mockFetchResponse(401, { error: 'invalid_credentials' });
    const result = await signInWithEmail('teszt@example.com', 'rossz');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Hibás email cím vagy jelszó.');
  });

  it('signUpWithEmail requires email confirmation', async () => {
    mockFetchResponse(201, { needsEmailConfirmation: true });
    const result = await signUpWithEmail('uj@example.com', 'titok123');
    expect(result.success).toBe(true);
    expect(result.needsEmailConfirmation).toBe(true);
  });
});

describe('getErrorMessage', () => {
  it('maps known backend codes to Hungarian messages', () => {
    expect(getErrorMessage(new ApiError('email_not_confirmed', 403))).toBe(
      'Kérjük, erősítsd meg az email címedet.'
    );
    expect(getErrorMessage(new ApiError('rate_limited', 429))).toBe(
      'Túl sok próbálkozás. Kérjük, próbáld újra később.'
    );
  });

  it('falls back to a generic message for unknown errors', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('Ismeretlen hiba történt.');
    expect(getErrorMessage(new ApiError('something_new', 500))).toBe('Ismeretlen hiba történt.');
  });
});

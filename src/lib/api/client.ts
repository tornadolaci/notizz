/**
 * API Client
 * Fetch wrapper for the Notizz PHP backend: base URL handling, Bearer token
 * storage (localStorage, PWA compatible) and JSON error normalization.
 */

/**
 * Error thrown for non-OK API responses. `code` is the stable error
 * identifier from the backend (e.g. 'invalid_credentials').
 */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

const TOKEN_STORAGE_KEY = 'notizz_auth_token';

// '/api' in dev (base '/'), '/app/notizz/api' in the production build
const API_BASE = `${import.meta.env.BASE_URL}api`;

// Called when an authenticated request gets a 401 (token revoked/expired)
let unauthorizedHandler: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // localStorage unavailable - session won't persist
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  /** Send the Bearer token and treat 401 as session loss (default: true) */
  auth?: boolean;
}

/**
 * Perform an API request and return the parsed JSON response.
 * Throws ApiError on network failure or non-OK status.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      // Some shared-hosting Apache setups strip the Authorization header
      // before it reaches PHP - X-Auth-Token is the reliable fallback
      headers['X-Auth-Token'] = token;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('network_error', 0);
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON body (shouldn't happen)
  }

  if (!response.ok) {
    const code = (data as { error?: string } | null)?.error ?? 'server_error';
    if (response.status === 401 && auth) {
      clearToken();
      unauthorizedHandler?.();
    }
    throw new ApiError(code, response.status);
  }

  return data as T;
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

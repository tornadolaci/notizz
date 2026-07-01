/**
 * Authentication Service
 * Handles all authentication operations with the PHP backend.
 */

import { apiFetch, ApiError, getToken, setToken, clearToken } from './client';
import type { IUser, ISession } from './types';

export interface AuthResult {
  success: boolean;
  user?: IUser | null;
  session?: ISession | null;
  error?: string;
  needsEmailConfirmation?: boolean;
}

interface UserDto {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  createdAt: string;
}

function toIUser(dto: UserDto): IUser {
  return {
    id: dto.id,
    email: dto.email,
    emailVerifiedAt: dto.emailVerifiedAt ? new Date(dto.emailVerifiedAt) : null,
    createdAt: new Date(dto.createdAt),
  };
}

/**
 * Sign up with email and password.
 * Requires email confirmation (verification link is sent by the backend).
 */
export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    await apiFetch<{ needsEmailConfirmation: boolean }>('auth/register', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    return { success: true, needsEmailConfirmation: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const data = await apiFetch<{ token: string; user: UserDto }>('auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    setToken(data.token);
    const user = toIUser(data.user);
    return { success: true, user, session: { token: data.token, user } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Sign out current user (revokes the token server-side too)
 */
export async function signOut(): Promise<AuthResult> {
  try {
    await apiFetch('auth/logout', { method: 'POST' });
  } catch {
    // Token may already be invalid - local cleanup still applies
  }
  clearToken();
  return { success: true };
}

/**
 * Get current session: validates the stored token against the backend.
 * Returns null when there is no token or it is no longer valid.
 */
export async function getSession(): Promise<ISession | null> {
  const token = getToken();
  if (!token) {
    return null;
  }
  try {
    const data = await apiFetch<{ user: UserDto }>('auth/me');
    return { token, user: toIUser(data.user) };
  } catch {
    return null;
  }
}

/**
 * Send password reset email.
 * Always succeeds from the client's point of view (no user enumeration).
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    await apiFetch('auth/password-reset-request', {
      method: 'POST',
      body: { email },
      auth: false,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Set a new password using the one-time token from the reset email
 */
export async function confirmPasswordReset(token: string, newPassword: string): Promise<AuthResult> {
  try {
    await apiFetch('auth/password-reset', {
      method: 'POST',
      body: { token, newPassword },
      auth: false,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Map stable backend error codes to Hungarian messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Hibás email cím vagy jelszó.',
  email_not_confirmed: 'Kérjük, erősítsd meg az email címedet.',
  email_taken: 'Ez az email cím már regisztrálva van.',
  password_too_short: 'A jelszónak legalább 6 karakter hosszúnak kell lennie.',
  invalid_email: 'Érvénytelen email formátum.',
  rate_limited: 'Túl sok próbálkozás. Kérjük, próbáld újra később.',
  invalid_token: 'A jelszó-visszaállító link érvénytelen vagy lejárt.',
  network_error: 'Nincs internetkapcsolat. Kérlek próbáld újra később.',
  unauthorized: 'A munkamenet lejárt. Kérjük, jelentkezz be újra.',
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const message = ERROR_MESSAGES[error.code];
    if (message !== undefined) {
      return message;
    }
  }
  return 'Ismeretlen hiba történt.';
}

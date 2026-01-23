/**
 * Authentication Service
 * Handles all authentication operations with Supabase
 */

import { supabase } from './client';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthResult {
  success: boolean;
  user?: User | null;
  session?: Session | null;
  error?: string;
  needsEmailConfirmation?: boolean;
}

/**
 * Sign up with email and password
 * Requires email confirmation
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Email confirmation required
        emailRedirectTo: `${window.location.origin}${baseUrl}`,
      },
    });

    if (error) {
      return { success: false, error: getErrorMessage(error) };
    }

    // Check if email confirmation is needed
    if (data.user && !data.session) {
      return {
        success: true,
        user: data.user,
        needsEmailConfirmation: true,
      };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch {
    return { success: false, error: 'Váratlan hiba történt a regisztráció során.' };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: getErrorMessage(error) };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch {
    return { success: false, error: 'Váratlan hiba történt a bejelentkezés során.' };
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    // Use full base URL including path for GitHub Pages
    const baseUrl = import.meta.env.BASE_URL || '/';
    const redirectUrl = `${window.location.origin}${baseUrl}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return { success: false, error: getErrorMessage(error) };
    }

    // OAuth redirect will happen, so we return success
    return { success: true };
  } catch {
    return { success: false, error: 'Váratlan hiba történt a Google bejelentkezés során.' };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: getErrorMessage(error) };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Váratlan hiba történt a kijelentkezés során.' };
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

/**
 * Get current user
 */
export async function getUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${baseUrl}reset-password`,
    });

    if (error) {
      return { success: false, error: getErrorMessage(error) };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Váratlan hiba történt.' };
  }
}

/**
 * Update password (after reset)
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: getErrorMessage(error) };
    }

    return { success: true, user: data.user };
  } catch {
    return { success: false, error: 'Váratlan hiba történt.' };
  }
}

/**
 * Convert Supabase auth errors to Hungarian messages
 */
function getErrorMessage(error: AuthError): string {
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Hibás email cím vagy jelszó.',
    'Email not confirmed': 'Kérjük, erősítsd meg az email címedet.',
    'User already registered': 'Ez az email cím már regisztrálva van.',
    'Password should be at least 6 characters': 'A jelszónak legalább 6 karakter hosszúnak kell lennie.',
    'Unable to validate email address: invalid format': 'Érvénytelen email formátum.',
    'Email rate limit exceeded': 'Túl sok próbálkozás. Kérjük, próbáld újra később.',
    'For security purposes, you can only request this once every 60 seconds': 'Biztonsági okokból csak 60 másodpercenként kérhetsz új emailt.',
  };

  return errorMessages[error.message] || error.message || 'Ismeretlen hiba történt.';
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
): { unsubscribe: () => void } {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return { unsubscribe: () => subscription.unsubscribe() };
}

/**
 * Authentication Store
 * Manages auth state using Svelte 5 runes pattern with writable store
 */

import { writable, derived, get } from 'svelte/store';
import type { User, Session } from '@supabase/supabase-js';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut as authSignOut,
  getSession,
  getUser,
  resetPassword,
  onAuthStateChange,
  type AuthResult,
} from '../supabase';

/**
 * Auth state interface
 */
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

/**
 * Initial auth state
 */
const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  initialized: false,
};

/**
 * Auth state writable store
 */
const authStateWritable = writable<AuthState>(initialState);

/**
 * Derived stores for convenient access
 */
export const authUser = derived(authStateWritable, ($state) => $state.user);
export const authSession = derived(authStateWritable, ($state) => $state.session);
export const authLoading = derived(authStateWritable, ($state) => $state.loading);
export const isAuthenticated = derived(authStateWritable, ($state) => !!$state.user);
export const isInitialized = derived(authStateWritable, ($state) => $state.initialized);

/**
 * Get current user ID synchronously
 */
export function getCurrentUserId(): string | null {
  const state = get(authStateWritable);
  return state.user?.id ?? null;
}

/**
 * Auth store with action methods
 */
export const authStore = {
  subscribe: authStateWritable.subscribe,

  /**
   * Initialize auth state - call on app startup
   */
  async initialize(): Promise<void> {
    try {
      // Get existing session from storage
      const session = await getSession();
      const user = session ? await getUser() : null;

      authStateWritable.update((state) => ({
        ...state,
        user,
        session,
        loading: false,
        initialized: true,
      }));

      // Listen to auth state changes
      onAuthStateChange((event, session) => {
        console.log('Auth event:', event);
        authStateWritable.update((state) => ({
          ...state,
          user: session?.user ?? null,
          session,
          loading: false,
        }));
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      authStateWritable.update((state) => ({
        ...state,
        loading: false,
        initialized: true,
      }));
    }
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string): Promise<AuthResult> {
    authStateWritable.update((state) => ({ ...state, loading: true }));

    const result = await signUpWithEmail(email, password);

    // Only set user/session if email confirmation is NOT required
    // If needsEmailConfirmation is true, user must verify email first
    if (result.needsEmailConfirmation) {
      // Don't log in the user - they need to confirm their email first
      authStateWritable.update((state) => ({
        ...state,
        loading: false,
      }));
    } else {
      authStateWritable.update((state) => ({
        ...state,
        user: result.user ?? null,
        session: result.session ?? null,
        loading: false,
      }));
    }

    return result;
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    authStateWritable.update((state) => ({ ...state, loading: true }));

    const result = await signInWithEmail(email, password);

    authStateWritable.update((state) => ({
      ...state,
      user: result.user ?? null,
      session: result.session ?? null,
      loading: false,
    }));

    return result;
  },

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<AuthResult> {
    authStateWritable.update((state) => ({ ...state, loading: true }));

    const result = await signInWithGoogle();

    // Note: Google OAuth will redirect, so loading state will persist
    // until the redirect completes and the page reloads
    if (!result.success) {
      authStateWritable.update((state) => ({ ...state, loading: false }));
    }

    return result;
  },

  /**
   * Sign out
   */
  async signOut(): Promise<AuthResult> {
    authStateWritable.update((state) => ({ ...state, loading: true }));

    const result = await authSignOut();

    if (result.success) {
      authStateWritable.update((state) => ({
        ...state,
        user: null,
        session: null,
        loading: false,
      }));
    } else {
      authStateWritable.update((state) => ({ ...state, loading: false }));
    }

    return result;
  },

  /**
   * Request password reset
   */
  async resetPassword(email: string): Promise<AuthResult> {
    return resetPassword(email);
  },

  /**
   * Get current user
   */
  getUser(): User | null {
    return get(authStateWritable).user;
  },

  /**
   * Get current session
   */
  getSession(): Session | null {
    return get(authStateWritable).session;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!get(authStateWritable).user;
  },
};

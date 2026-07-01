/**
 * Authentication Store
 * Manages auth state using Svelte 5 runes pattern with writable store.
 * Backed by the PHP API (token-based auth, see $lib/api).
 */

import { writable, derived, get } from 'svelte/store';
import {
  signUpWithEmail,
  signInWithEmail,
  signOut as authSignOut,
  getSession,
  resetPassword,
  registerUnauthorizedHandler,
  type AuthResult,
  type IUser,
  type ISession,
} from '../api';

/**
 * Auth state interface
 */
interface AuthState {
  user: IUser | null;
  session: ISession | null;
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
   * Initialize auth state - call on app startup.
   * Validates the stored token against the backend.
   */
  async initialize(): Promise<void> {
    try {
      // When an authenticated request hits a 401 (token revoked elsewhere),
      // drop the local session so the UI falls back to the login state
      registerUnauthorizedHandler(() => {
        authStateWritable.update((state) => ({
          ...state,
          user: null,
          session: null,
          loading: false,
        }));
      });

      const session = await getSession();

      authStateWritable.update((state) => ({
        ...state,
        user: session?.user ?? null,
        session,
        loading: false,
        initialized: true,
      }));
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

    // Registration always requires email confirmation - the user must verify
    // their email before logging in, so no session is created here
    authStateWritable.update((state) => ({
      ...state,
      loading: false,
    }));

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
   * Sign out
   */
  async signOut(): Promise<AuthResult> {
    authStateWritable.update((state) => ({ ...state, loading: true }));

    const result = await authSignOut();

    authStateWritable.update((state) => ({
      ...state,
      user: null,
      session: null,
      loading: false,
    }));

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
  getUser(): IUser | null {
    return get(authStateWritable).user;
  },

  /**
   * Get current session
   */
  getSession(): ISession | null {
    return get(authStateWritable).session;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!get(authStateWritable).user;
  },
};

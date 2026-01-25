/**
 * Supabase Client Configuration
 * Initializes and exports the Supabase client instance
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase project configuration from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

/**
 * Supabase client instance with persistent session storage
 * Session never expires unless user explicitly logs out
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      // Use localStorage for session persistence (PWA compatible)
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      // Keep session alive - auto refresh tokens
      autoRefreshToken: true,
      // Persist session across browser tabs/windows
      persistSession: true,
      // Detect session from URL (for OAuth redirects)
      detectSessionInUrl: true,
      // Flow type for OAuth
      flowType: 'pkce',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Sync Service
 * Handles real-time subscriptions for authenticated users
 * Guest users use IndexedDB only (no sync needed)
 *
 * Note: With authenticated users, we no longer use IndexedDB at all.
 * The stores load/save directly to/from Supabase.
 * This service only provides realtime subscription for live updates.
 */

import { supabase, isOnline } from './client';
import { db } from '../db/schema';
import { SupabaseNotesService, SupabaseTodosService } from './data.service';
import type { INote, ITodo } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Re-export isOnline for convenience
export { isOnline };

/**
 * Clear all local data (for logout - clears guest data)
 */
export async function clearLocalData(): Promise<void> {
  await db.notes.clear();
  await db.todos.clear();
}

// Real-time subscription channels
let notesChannel: RealtimeChannel | null = null;
let todosChannel: RealtimeChannel | null = null;

// Debounce delay to prevent rapid updates
const REALTIME_DEBOUNCE_MS = 500;

// Track pending updates
let notesDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let todosDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// Polling interval for background sync (in milliseconds)
const POLLING_INTERVAL_MS = 10000; // 10 seconds
let pollingIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Subscribe to real-time changes from Supabase
 * For authenticated users: directly updates the store (no IndexedDB)
 */
export function subscribeToChanges(
  userId: string,
  onNotesChange: (notes: INote[]) => void,
  onTodosChange: (todos: ITodo[]) => void
): () => void {
  // Subscribe to notes changes
  notesChannel = supabase
    .channel('notes-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notes',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        // Debounce to avoid rapid updates
        if (notesDebounceTimer) {
          clearTimeout(notesDebounceTimer);
        }
        notesDebounceTimer = setTimeout(async () => {
          try {
            // Fetch fresh data from Supabase and update store directly
            const notes = await SupabaseNotesService.getAll(userId);
            onNotesChange(notes);
          } catch (err) {
            console.error('Error handling notes change:', err);
          }
        }, REALTIME_DEBOUNCE_MS);
      }
    )
    .subscribe();

  // Subscribe to todos changes
  todosChannel = supabase
    .channel('todos-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'todos',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        // Debounce to avoid rapid updates
        if (todosDebounceTimer) {
          clearTimeout(todosDebounceTimer);
        }
        todosDebounceTimer = setTimeout(async () => {
          try {
            // Fetch fresh data from Supabase and update store directly
            const todos = await SupabaseTodosService.getAll(userId);
            onTodosChange(todos);
          } catch (err) {
            console.error('Error handling todos change:', err);
          }
        }, REALTIME_DEBOUNCE_MS);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    // Clear debounce timers
    if (notesDebounceTimer) {
      clearTimeout(notesDebounceTimer);
      notesDebounceTimer = null;
    }
    if (todosDebounceTimer) {
      clearTimeout(todosDebounceTimer);
      todosDebounceTimer = null;
    }
    // Remove channels
    if (notesChannel) {
      supabase.removeChannel(notesChannel);
      notesChannel = null;
    }
    if (todosChannel) {
      supabase.removeChannel(todosChannel);
      todosChannel = null;
    }
  };
}

/**
 * Unsubscribe from real-time changes
 */
export function unsubscribeFromChanges(): void {
  // Clear debounce timers
  if (notesDebounceTimer) {
    clearTimeout(notesDebounceTimer);
    notesDebounceTimer = null;
  }
  if (todosDebounceTimer) {
    clearTimeout(todosDebounceTimer);
    todosDebounceTimer = null;
  }
  // Remove channels
  if (notesChannel) {
    supabase.removeChannel(notesChannel);
    notesChannel = null;
  }
  if (todosChannel) {
    supabase.removeChannel(todosChannel);
    todosChannel = null;
  }
}

/**
 * Start polling for changes from Supabase
 * This complements real-time subscriptions for better reliability
 * For authenticated users: directly updates the store (no IndexedDB)
 */
export function startPolling(
  userId: string,
  onNotesChange: (notes: INote[]) => void,
  onTodosChange: (todos: ITodo[]) => void
): () => void {
  // Stop any existing polling
  stopPolling();

  async function pollForChanges() {
    if (!isOnline()) return;

    try {
      // Fetch fresh data from Supabase
      const [notes, todos] = await Promise.all([
        SupabaseNotesService.getAll(userId),
        SupabaseTodosService.getAll(userId),
      ]);

      // Update stores directly
      onNotesChange(notes);
      onTodosChange(todos);
    } catch (err) {
      console.error('Polling sync error:', err);
    }
  }

  // Start interval (no immediate poll to avoid race condition with initial load)
  pollingIntervalId = setInterval(pollForChanges, POLLING_INTERVAL_MS);

  // Return stop function
  return stopPolling;
}

/**
 * Stop polling for changes
 */
export function stopPolling(): void {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
  }
}

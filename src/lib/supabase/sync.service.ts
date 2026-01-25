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
import NotificationService from '../services/notification.service';

// Re-export isOnline for convenience
export { isOnline };

// Callback for in-app toast notifications
type ToastCallback = (message: string) => void;
let toastCallback: ToastCallback | null = null;

/**
 * Register a callback for in-app toast notifications
 */
export function registerToastCallback(callback: ToastCallback): void {
	toastCallback = callback;
}

/**
 * Unregister toast callback
 */
export function unregisterToastCallback(): void {
	toastCallback = null;
}

/**
 * Show notification for content change
 */
function showContentChangeNotification(type: 'note' | 'todo', title: string): void {
	// Show native notification with sound
	NotificationService.showNotification({
		type,
		title,
		message: `${type === 'note' ? 'Jegyzet' : 'TODO'}: ${title}`,
	});

	// Show in-app toast
	if (toastCallback) {
		const message = `Tartalom frissítés érkezett! ${type === 'note' ? 'Jegyzet' : 'TODO'}: ${title}`;
		toastCallback(message);
	}
}

/**
 * Deep comparison helper to detect actual content changes
 */
function hasContentChanged<T extends INote | ITodo>(oldItems: T[], newItems: T[]): T[] {
	const changedItems: T[] = [];

	for (const newItem of newItems) {
		const oldItem = oldItems.find((item) => item.id === newItem.id);

		// New item added
		if (!oldItem) {
			changedItems.push(newItem);
			continue;
		}

		// Check if updatedAt changed (indicates modification)
		if (newItem.updatedAt.getTime() !== oldItem.updatedAt.getTime()) {
			changedItems.push(newItem);
		}
	}

	return changedItems;
}

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

// Track the current user ID to prevent stale callbacks after logout
let currentSyncUserId: string | null = null;

// Store previous state for change detection
let previousNotes: INote[] = [];
let previousTodos: ITodo[] = [];

/**
 * Subscribe to real-time changes from Supabase
 * For authenticated users: directly updates the store (no IndexedDB)
 */
export function subscribeToChanges(
  userId: string,
  onNotesChange: (notes: INote[]) => void,
  onTodosChange: (todos: ITodo[]) => void
): () => void {
  // Track the current user ID to prevent stale callbacks after logout
  currentSyncUserId = userId;

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
          // Check if user is still logged in with the same ID
          if (currentSyncUserId !== userId) {
            return; // User logged out or changed, skip update
          }
          try {
            // Fetch fresh data from Supabase and update store directly
            const notes = await SupabaseNotesService.getAll(userId);
            // Double-check user ID after async operation
            if (currentSyncUserId !== userId) {
              return; // User logged out during fetch, skip update
            }

            // Detect changes and show notifications
            const changedNotes = hasContentChanged(previousNotes, notes);
            for (const note of changedNotes) {
              showContentChangeNotification('note', note.title || 'Névtelen jegyzet');
            }

            // Update store and save previous state
            onNotesChange(notes);
            previousNotes = notes;
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
          // Check if user is still logged in with the same ID
          if (currentSyncUserId !== userId) {
            return; // User logged out or changed, skip update
          }
          try {
            // Fetch fresh data from Supabase and update store directly
            const todos = await SupabaseTodosService.getAll(userId);
            // Double-check user ID after async operation
            if (currentSyncUserId !== userId) {
              return; // User logged out during fetch, skip update
            }

            // Detect changes and show notifications
            const changedTodos = hasContentChanged(previousTodos, todos);
            for (const todo of changedTodos) {
              showContentChangeNotification('todo', todo.title || 'Névtelen TODO');
            }

            // Update store and save previous state
            onTodosChange(todos);
            previousTodos = todos;
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
  // Clear the current user ID FIRST to prevent any pending callbacks from executing
  currentSyncUserId = null;

  // Clear previous state
  previousNotes = [];
  previousTodos = [];

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

  // Track the current user ID for this polling session
  currentSyncUserId = userId;

  async function pollForChanges() {
    // Check if user is still logged in with the same ID
    if (currentSyncUserId !== userId) {
      return; // User logged out or changed, skip polling
    }

    if (!isOnline()) return;

    try {
      // Fetch fresh data from Supabase
      const [notes, todos] = await Promise.all([
        SupabaseNotesService.getAll(userId),
        SupabaseTodosService.getAll(userId),
      ]);

      // Double-check user ID after async operation
      if (currentSyncUserId !== userId) {
        return; // User logged out during fetch, skip update
      }

      // Detect changes and show notifications for notes
      const changedNotes = hasContentChanged(previousNotes, notes);
      for (const note of changedNotes) {
        showContentChangeNotification('note', note.title || 'Névtelen jegyzet');
      }

      // Detect changes and show notifications for todos
      const changedTodos = hasContentChanged(previousTodos, todos);
      for (const todo of changedTodos) {
        showContentChangeNotification('todo', todo.title || 'Névtelen TODO');
      }

      // Update stores directly
      onNotesChange(notes);
      onTodosChange(todos);

      // Save previous state for next comparison
      previousNotes = notes;
      previousTodos = todos;
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
  // Clear the current user ID to prevent any pending callbacks from executing
  currentSyncUserId = null;

  // Clear previous state
  previousNotes = [];
  previousTodos = [];

  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
  }
}

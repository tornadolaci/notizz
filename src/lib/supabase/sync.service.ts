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

// === SYNC STATUS TRACKING ===
// Tracks whether the database sync is currently active
let syncActive = false;
let lastSuccessfulSync: Date | null = null;

// Callback for notifying components about sync status changes
type SyncStatusCallback = (active: boolean) => void;
let syncStatusCallback: SyncStatusCallback | null = null;

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
 * Register a callback to be notified when sync status changes
 */
export function registerSyncStatusCallback(callback: SyncStatusCallback): void {
	syncStatusCallback = callback;
}

/**
 * Unregister the sync status callback
 */
export function unregisterSyncStatusCallback(): void {
	syncStatusCallback = null;
}

/**
 * Get current sync status
 */
export function getSyncStatus(): { active: boolean; lastSync: Date | null } {
	return { active: syncActive, lastSync: lastSuccessfulSync };
}

/**
 * Internal: Update sync status and notify callback
 */
function updateSyncStatus(active: boolean): void {
	syncActive = active;
	if (active) {
		lastSuccessfulSync = new Date();
	}
	if (syncStatusCallback) {
		syncStatusCallback(active);
	}
}

/**
 * Show notification for content change
 * Returns true if notification was shown, false if it was already notified or is a local modification
 */
function showContentChangeNotification(type: 'note' | 'todo', id: string, title: string, updatedAt: Date): boolean {
	// Skip notification for locally made changes (user's own modifications)
	if (isLocalModification(type, id, updatedAt)) {
		return false;
	}

	// Check if we already notified about this specific update
	if (wasAlreadyNotified(type, id, updatedAt)) {
		return false;
	}

	// Mark as notified BEFORE showing notification to prevent race conditions
	markAsNotified(type, id, updatedAt);

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

	return true;
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

// Track notified items to prevent duplicate notifications across app restarts
// Key format: "note_<id>_<updatedAt>" or "todo_<id>_<updatedAt>"
const NOTIFIED_ITEMS_KEY = 'notizz_notified_items';
const MAX_NOTIFIED_ITEMS = 100; // Prevent localStorage bloat

// Track locally modified items to prevent self-notifications
// Key format: "note_<id>" or "todo_<id>"
// Value: timestamp when modified - any changes within TTL window are considered local
const LOCAL_MODIFICATION_TTL_MS = 15000; // 15 seconds window
const localModifications = new Map<string, number>(); // key -> timestamp when modified

/**
 * Register a local modification to prevent self-notification
 * Called by stores when user makes a change
 * Note: We track by id only, not by updatedAt, because Supabase may return
 * a different timestamp than what the client sent
 */
export function registerLocalModification(type: 'note' | 'todo', id: string, _updatedAt: Date): void {
  const key = `${type}_${id}`;
  localModifications.set(key, Date.now());

  // Clean up old entries
  cleanupLocalModifications();
}

/**
 * Check if a modification was made locally (by this client) within the TTL window
 * This prevents self-notifications when changes come back via realtime/polling
 */
function isLocalModification(type: 'note' | 'todo', id: string, _updatedAt: Date): boolean {
  const key = `${type}_${id}`;
  const modifiedAt = localModifications.get(key);

  if (!modifiedAt) return false;

  const now = Date.now();

  // Check if modification is within the TTL window
  if (now - modifiedAt > LOCAL_MODIFICATION_TTL_MS) {
    // Expired - clean up and return false
    localModifications.delete(key);
    return false;
  }

  // Within TTL window - this is likely our own modification coming back
  return true;
}

/**
 * Clean up expired local modification entries
 */
function cleanupLocalModifications(): void {
  const now = Date.now();
  for (const [key, modifiedAt] of localModifications.entries()) {
    if (now - modifiedAt > LOCAL_MODIFICATION_TTL_MS) {
      localModifications.delete(key);
    }
  }
}

function getNotifiedItems(): Set<string> {
  try {
    const stored = localStorage.getItem(NOTIFIED_ITEMS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function addNotifiedItem(key: string): void {
  try {
    const items = getNotifiedItems();
    items.add(key);
    // Keep only the most recent items to prevent bloat
    const itemsArray = Array.from(items);
    if (itemsArray.length > MAX_NOTIFIED_ITEMS) {
      const trimmed = itemsArray.slice(-MAX_NOTIFIED_ITEMS);
      localStorage.setItem(NOTIFIED_ITEMS_KEY, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(NOTIFIED_ITEMS_KEY, JSON.stringify(itemsArray));
    }
  } catch {
    // Ignore localStorage errors
  }
}

function wasAlreadyNotified(type: 'note' | 'todo', id: string, updatedAt: Date): boolean {
  const key = `${type}_${id}_${updatedAt.getTime()}`;
  return getNotifiedItems().has(key);
}

function markAsNotified(type: 'note' | 'todo', id: string, updatedAt: Date): void {
  const key = `${type}_${id}_${updatedAt.getTime()}`;
  addNotifiedItem(key);
}

/**
 * Initialize previous state with current data
 * This MUST be called after initial data load but BEFORE starting sync
 * to prevent false "new content" notifications on app startup
 */
export function initializePreviousState(notes: INote[], todos: ITodo[]): void {
  previousNotes = [...notes];
  previousTodos = [...todos];

  // Also mark all current items as "already notified" to prevent
  // false notifications on app restart
  for (const note of notes) {
    if (note.id) {
      markAsNotified('note', note.id, note.updatedAt);
    }
  }
  for (const todo of todos) {
    if (todo.id) {
      markAsNotified('todo', todo.id, todo.updatedAt);
    }
  }
}

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
              if (note.id) {
                showContentChangeNotification('note', note.id, note.title || 'Névtelen jegyzet', note.updatedAt);
              }
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
              if (todo.id) {
                showContentChangeNotification('todo', todo.id, todo.title || 'Névtelen TODO', todo.updatedAt);
              }
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
  // Reset sync status
  updateSyncStatus(false);

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

    if (!isOnline()) {
      updateSyncStatus(false);
      return;
    }

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

      // === Sikeres sync ===
      updateSyncStatus(true);

      // Detect changes and show notifications for notes
      const changedNotes = hasContentChanged(previousNotes, notes);
      for (const note of changedNotes) {
        if (note.id) {
          showContentChangeNotification('note', note.id, note.title || 'Névtelen jegyzet', note.updatedAt);
        }
      }

      // Detect changes and show notifications for todos
      const changedTodos = hasContentChanged(previousTodos, todos);
      for (const todo of changedTodos) {
        if (todo.id) {
          showContentChangeNotification('todo', todo.id, todo.title || 'Névtelen TODO', todo.updatedAt);
        }
      }

      // Update stores directly
      onNotesChange(notes);
      onTodosChange(todos);

      // Save previous state for next comparison
      previousNotes = notes;
      previousTodos = todos;
    } catch (err) {
      console.error('Polling sync error:', err);
      updateSyncStatus(false);
    }
  }

  // Run immediate poll for instant feedback, then start interval
  pollForChanges().finally(() => {
    // Only start interval if polling wasn't stopped during the first poll
    if (currentSyncUserId === userId) {
      pollingIntervalId = setInterval(pollForChanges, POLLING_INTERVAL_MS);
    }
  });

  // Return stop function
  return stopPolling;
}

/**
 * Stop polling for changes
 */
export function stopPolling(): void {
  // Reset sync status immediately
  updateSyncStatus(false);

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

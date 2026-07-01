/**
 * Sync Service
 * Polling-based synchronization for authenticated users.
 *
 * The previous Supabase realtime subscription is gone - the 10s polling
 * (which was already the reliability fallback) is now the sole sync
 * mechanism. Change detection, notifications and sync status tracking
 * are unchanged.
 */

import { isOnline } from './client';
import { ApiNotesService, ApiTodosService } from './data.service';
import type { INote, ITodo } from '../types';
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
 * Note: We track by id only, not by updatedAt, because the server round-trip
 * may return a slightly different timestamp than what the client sent
 */
export function registerLocalModification(type: 'note' | 'todo', id: string, _updatedAt: Date): void {
  const key = `${type}_${id}`;
  localModifications.set(key, Date.now());

  // Clean up old entries
  cleanupLocalModifications();
}

/**
 * Check if a modification was made locally (by this client) within the TTL window
 * This prevents self-notifications when changes come back via polling
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
 * Start polling for changes from the backend
 * Directly updates the stores via the provided callbacks
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
      // Fetch fresh data from the backend
      const [notes, todos] = await Promise.all([
        ApiNotesService.getAll(),
        ApiTodosService.getAll(),
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

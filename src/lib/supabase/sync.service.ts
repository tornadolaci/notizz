/**
 * Sync Service
 * Handles synchronization between IndexedDB and Supabase
 * Manages offline queue and real-time subscriptions
 */

import { supabase, isOnline } from './client';
import { db } from '../db/schema';
import { SupabaseNotesService, SupabaseTodosService } from './data.service';
import type { INote, ITodo } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';
type TableName = 'notes' | 'todos';

interface SyncQueueItem {
  id: string;
  operation: SyncOperation;
  tableName: TableName;
  recordId: string;
  payload?: INote | ITodo;
  createdAt: Date;
}

// Store sync queue in IndexedDB
const SYNC_QUEUE_KEY = 'notizz_sync_queue';

/**
 * Safely convert a date value to timestamp (handles Date objects and strings)
 */
function toTimestamp(date: Date | string | number): number {
  if (date instanceof Date) {
    return date.getTime();
  }
  if (typeof date === 'number') {
    return date;
  }
  // String - parse it
  return new Date(date).getTime();
}

/**
 * Merge local and remote items, keeping the newer version based on updatedAt
 * Also handles items that only exist locally or remotely
 * Safely handles Date/string comparison for updatedAt field
 */
function mergeByUpdatedAt<T extends { id?: string; updatedAt: Date | string }>(
  localItems: T[],
  remoteItems: T[]
): T[] {
  const merged = new Map<string, T>();

  // Add all remote items first
  for (const remote of remoteItems) {
    if (remote.id) {
      merged.set(remote.id, remote);
    }
  }

  // Then check local items - keep local if newer
  for (const local of localItems) {
    if (!local.id) continue;

    const remote = merged.get(local.id);
    if (!remote) {
      // Only exists locally - keep it
      merged.set(local.id, local);
    } else {
      // Exists in both - keep the newer one (safely handle Date/string)
      const localTime = toTimestamp(local.updatedAt);
      const remoteTime = toTimestamp(remote.updatedAt);

      if (localTime > remoteTime) {
        // Local is newer - keep local
        merged.set(local.id, local);
      }
      // Otherwise remote (already in map) is kept
    }
  }

  return Array.from(merged.values());
}

/**
 * Get sync queue from localStorage
 */
function getSyncQueue(): SyncQueueItem[] {
  try {
    const data = localStorage.getItem(SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save sync queue to localStorage
 */
function saveSyncQueue(queue: SyncQueueItem[]): void {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Error saving sync queue:', err);
  }
}

/**
 * Add item to sync queue
 */
export function addToSyncQueue(
  operation: SyncOperation,
  tableName: TableName,
  recordId: string,
  payload?: INote | ITodo
): void {
  const queue = getSyncQueue();

  // Remove any existing operations for the same record
  const filteredQueue = queue.filter(
    (item) => !(item.tableName === tableName && item.recordId === recordId)
  );

  // If it's a DELETE, remove all previous operations for this record
  // If it's an INSERT followed by DELETE, we can skip both
  if (operation === 'DELETE') {
    const hadInsert = queue.some(
      (item) =>
        item.tableName === tableName &&
        item.recordId === recordId &&
        item.operation === 'INSERT'
    );

    if (hadInsert) {
      // The record was created offline and deleted offline - no sync needed
      saveSyncQueue(filteredQueue);
      return;
    }
  }

  // Add new operation to queue
  filteredQueue.push({
    id: crypto.randomUUID(),
    operation,
    tableName,
    recordId,
    payload,
    createdAt: new Date(),
  });

  saveSyncQueue(filteredQueue);
}

/**
 * Process sync queue - sync all pending operations to Supabase
 */
export async function processSyncQueue(userId: string): Promise<{ success: number; failed: number }> {
  if (!isOnline()) {
    return { success: 0, failed: 0 };
  }

  const queue = getSyncQueue();
  if (queue.length === 0) {
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;
  const processedIds: string[] = [];

  for (const item of queue) {
    try {
      if (item.tableName === 'notes') {
        await processNoteOperation(item, userId);
      } else if (item.tableName === 'todos') {
        await processTodoOperation(item, userId);
      }

      processedIds.push(item.id);
      success++;
    } catch (err) {
      console.error(`Sync failed for ${item.tableName}/${item.recordId}:`, err);
      failed++;
    }
  }

  // Remove processed items from queue
  const remainingQueue = queue.filter((item) => !processedIds.includes(item.id));
  saveSyncQueue(remainingQueue);

  return { success, failed };
}

/**
 * Process a note operation
 */
async function processNoteOperation(item: SyncQueueItem, userId: string): Promise<void> {
  switch (item.operation) {
    case 'INSERT':
    case 'UPDATE':
      if (item.payload) {
        await SupabaseNotesService.upsert(item.payload as INote, userId);
      }
      break;
    case 'DELETE':
      await SupabaseNotesService.delete(item.recordId, userId);
      break;
  }
}

/**
 * Process a todo operation
 */
async function processTodoOperation(item: SyncQueueItem, userId: string): Promise<void> {
  switch (item.operation) {
    case 'INSERT':
    case 'UPDATE':
      if (item.payload) {
        await SupabaseTodosService.upsert(item.payload as ITodo, userId);
      }
      break;
    case 'DELETE':
      await SupabaseTodosService.delete(item.recordId, userId);
      break;
  }
}

/**
 * Full sync - download all data from Supabase and merge with local
 */
export async function fullSync(userId: string): Promise<void> {
  if (!isOnline()) return;

  try {
    // First, process any pending sync queue
    await processSyncQueue(userId);

    // Fetch all data from Supabase
    const [remoteNotes, remoteTodos] = await Promise.all([
      SupabaseNotesService.getAll(userId),
      SupabaseTodosService.getAll(userId),
    ]);

    // Get local data
    const localNotes = await db.notes.toArray();
    const localTodos = await db.todos.toArray();

    // Merge notes - remote data wins for now (could implement conflict resolution later)
    const remoteNoteIds = new Set(remoteNotes.map((n) => n.id));
    const localOnlyNotes = localNotes.filter((n) => n.id && !remoteNoteIds.has(n.id));

    // Upload local-only notes to Supabase (use upsert to avoid duplicates)
    for (const note of localOnlyNotes) {
      if (note.id) {
        try {
          await SupabaseNotesService.upsert(note, userId);
        } catch (err) {
          console.error('Error uploading local note:', err);
        }
      }
    }

    // Clear local notes and replace with remote
    await db.notes.clear();
    if (remoteNotes.length > 0) {
      await db.notes.bulkPut(remoteNotes);
    }

    // Merge todos - same approach
    const remoteTodoIds = new Set(remoteTodos.map((t) => t.id));
    const localOnlyTodos = localTodos.filter((t) => t.id && !remoteTodoIds.has(t.id));

    // Upload local-only todos to Supabase (use upsert to avoid duplicates)
    for (const todo of localOnlyTodos) {
      if (todo.id) {
        try {
          await SupabaseTodosService.upsert(todo, userId);
        } catch (err) {
          console.error('Error uploading local todo:', err);
        }
      }
    }

    // Clear local todos and replace with remote
    await db.todos.clear();
    if (remoteTodos.length > 0) {
      await db.todos.bulkPut(remoteTodos);
    }

    console.log('Full sync completed');
  } catch (err) {
    console.error('Full sync failed:', err);
    throw err;
  }
}

/**
 * Clear all local data (for logout)
 */
export async function clearLocalData(): Promise<void> {
  await db.notes.clear();
  await db.todos.clear();
  saveSyncQueue([]);
}

// Real-time subscription channels
let notesChannel: RealtimeChannel | null = null;
let todosChannel: RealtimeChannel | null = null;

// Debounce delay to prevent race conditions with local updates
const REALTIME_DEBOUNCE_MS = 500;

// Track pending updates to avoid overwriting local changes
let notesDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let todosDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// Polling interval for background sync (in milliseconds)
const POLLING_INTERVAL_MS = 30000; // 30 seconds
let pollingIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Subscribe to real-time changes
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
        // Debounce to avoid race conditions with local updates
        if (notesDebounceTimer) {
          clearTimeout(notesDebounceTimer);
        }
        notesDebounceTimer = setTimeout(async () => {
          try {
            const remoteNotes = await SupabaseNotesService.getAll(userId);
            const localNotes = await db.notes.toArray();

            // Merge: keep the newer version of each note
            const mergedNotes = mergeByUpdatedAt(localNotes, remoteNotes);

            // Update local DB with merged data
            await db.notes.clear();
            if (mergedNotes.length > 0) {
              await db.notes.bulkPut(mergedNotes);
            }
            onNotesChange(mergedNotes);
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
        // Debounce to avoid race conditions with local updates
        if (todosDebounceTimer) {
          clearTimeout(todosDebounceTimer);
        }
        todosDebounceTimer = setTimeout(async () => {
          try {
            const remoteTodos = await SupabaseTodosService.getAll(userId);
            const localTodos = await db.todos.toArray();

            // Merge: keep the newer version of each todo
            const mergedTodos = mergeByUpdatedAt(localTodos, remoteTodos);

            // Update local DB with merged data
            await db.todos.clear();
            if (mergedTodos.length > 0) {
              await db.todos.bulkPut(mergedTodos);
            }
            onTodosChange(mergedTodos);
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
      // Fetch remote data
      const [remoteNotes, remoteTodos] = await Promise.all([
        SupabaseNotesService.getAll(userId),
        SupabaseTodosService.getAll(userId),
      ]);

      // Get local data
      const localNotes = await db.notes.toArray();
      const localTodos = await db.todos.toArray();

      // Merge notes - keep newer versions
      const mergedNotes = mergeByUpdatedAt(localNotes, remoteNotes);
      const mergedTodos = mergeByUpdatedAt(localTodos, remoteTodos);

      // Check if there are actual changes before updating
      const notesChanged = JSON.stringify(localNotes.map(n => ({ id: n.id, updatedAt: n.updatedAt }))) !==
        JSON.stringify(mergedNotes.map(n => ({ id: n.id, updatedAt: n.updatedAt })));
      const todosChanged = JSON.stringify(localTodos.map(t => ({ id: t.id, updatedAt: t.updatedAt }))) !==
        JSON.stringify(mergedTodos.map(t => ({ id: t.id, updatedAt: t.updatedAt })));

      // Update local DB and notify only if changed
      if (notesChanged) {
        await db.notes.clear();
        if (mergedNotes.length > 0) {
          await db.notes.bulkPut(mergedNotes);
        }
        onNotesChange(mergedNotes);
      }

      if (todosChanged) {
        await db.todos.clear();
        if (mergedTodos.length > 0) {
          await db.todos.bulkPut(mergedTodos);
        }
        onTodosChange(mergedTodos);
      }
    } catch (err) {
      console.error('Polling sync error:', err);
    }
  }

  // Run initial poll immediately
  pollForChanges();

  // Start interval
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

/**
 * Check if there are pending sync items
 */
export function hasPendingSyncItems(): boolean {
  return getSyncQueue().length > 0;
}

/**
 * Get pending sync count
 */
export function getPendingSyncCount(): number {
  return getSyncQueue().length;
}

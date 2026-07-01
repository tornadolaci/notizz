import { writable, derived, get } from 'svelte/store';
import type { INote } from '$lib/types';
import { ApiNotesService, isOnline, registerLocalModification } from '$lib/api';
import { getCurrentUserId } from './auth';

interface NotesState {
  value: INote[];
  loading: boolean;
  error: Error | null;
}

const OFFLINE_ERROR = 'Nincs internetkapcsolat. Kérlek próbáld újra később.';
const UNAUTHENTICATED_ERROR = 'Nincs bejelentkezett felhasználó.';

/**
 * Internal writable store
 */
const notesStateWritable = writable<NotesState>({
  value: [],
  loading: false,
  error: null
});

/**
 * Derived stores
 */
export const notesValue = derived(notesStateWritable, ($state) => $state.value);
export const notesLoading = derived(notesStateWritable, ($state) => $state.loading);
export const notesError = derived(notesStateWritable, ($state) => $state.error);

/**
 * Ensure the user is authenticated and online before a write operation
 */
function requireOnlineUser(): void {
  if (!getCurrentUserId()) {
    throw new Error(UNAUTHENTICATED_ERROR);
  }
  if (!isOnline()) {
    throw new Error(OFFLINE_ERROR);
  }
}

/**
 * Notes store with actions
 *
 * Auth-only: all data lives on the server, accessed via the API.
 * Offline: reads yield an empty list, writes fail with a Hungarian error.
 */
export const notesStore = {
  // Subscribe to the main state
  subscribe: notesStateWritable.subscribe,

  /**
   * Load all notes from the API
   */
  async load(): Promise<void> {
    const userId = getCurrentUserId();

    try {
      notesStateWritable.update(s => ({ ...s, loading: true, error: null }));

      // Not authenticated or offline: nothing to load (the auth gate handles the UI)
      const value = userId && isOnline() ? await ApiNotesService.getAll() : [];

      notesStateWritable.set({ value, loading: false, error: null });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to load notes');
      notesStateWritable.update(s => ({ ...s, loading: false, error: err }));
      console.error('Error loading notes:', error);
    }
  },

  /**
   * Set notes directly (used by the sync service for polling updates)
   * Deduplicates by ID - keeps the one with newer updatedAt
   * IMPORTANT: Only updates if user is authenticated to prevent
   * stale sync callbacks from firing after logout
   */
  setNotes(notes: INote[]): void {
    const userId = getCurrentUserId();
    if (!userId) {
      return;
    }

    // Deduplicate by ID - keep the one with newer updatedAt
    const uniqueMap = new Map<string, INote>();
    for (const note of notes) {
      if (note.id) {
        const existing = uniqueMap.get(note.id);
        if (!existing || new Date(note.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
          uniqueMap.set(note.id, note);
        }
      }
    }
    notesStateWritable.set({
      value: Array.from(uniqueMap.values()),
      loading: false,
      error: null
    });
  },

  /**
   * Add a new note
   */
  async add(note: INote): Promise<void> {
    try {
      requireOnlineUser();

      // Calculate order to place new note at the top
      const state = get(notesStateWritable);
      const minOrder = state.value.length > 0
        ? Math.min(...state.value.map(n => n.order))
        : Date.now();

      // New note gets minimum order - 1000 (or Date.now() if first note)
      const noteWithOrder = {
        ...note,
        order: state.value.length > 0 ? minOrder - 1000 : minOrder
      };

      // Register as local modification BEFORE the API call to prevent self-notification
      // (polling might fire before we get the response)
      registerLocalModification('note', noteWithOrder.id!, noteWithOrder.updatedAt);

      const savedNote = await ApiNotesService.create(noteWithOrder);

      // Update store with the saved note
      notesStateWritable.update(s => {
        if (s.value.some(n => n.id === savedNote.id)) {
          return {
            ...s,
            value: s.value.map(n => n.id === savedNote.id ? savedNote : n)
          };
        }
        return {
          ...s,
          value: [...s.value, savedNote]
        };
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to add note');
      notesStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error adding note:', error);
      throw error;
    }
  },

  /**
   * Update an existing note
   */
  async update(id: string, updates: Partial<Omit<INote, 'id' | 'createdAt'>>): Promise<void> {
    try {
      requireOnlineUser();

      // Only update updatedAt if it's not just an order change
      const isOnlyOrderChange = Object.keys(updates).length === 1 && 'order' in updates;
      const newUpdatedAt = isOnlyOrderChange ? undefined : new Date();

      // Register as local modification BEFORE the API call to prevent self-notification
      // (polling might fire before we get the response)
      if (!isOnlyOrderChange) {
        registerLocalModification('note', id, newUpdatedAt!);
      }

      await ApiNotesService.update(id, updates);

      // Optimistic update in store
      notesStateWritable.update(s => ({
        ...s,
        value: s.value.map(note => {
          if (note.id === id) {
            return { ...note, ...updates, ...(isOnlyOrderChange ? {} : { updatedAt: newUpdatedAt! }) };
          }
          return note;
        })
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update note');
      notesStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error updating note:', error);
      throw error;
    }
  },

  /**
   * Delete a note
   */
  async remove(id: string): Promise<void> {
    try {
      requireOnlineUser();

      await ApiNotesService.delete(id);

      // Optimistic update
      notesStateWritable.update(s => ({
        ...s,
        value: s.value.filter(note => note.id !== id)
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete note');
      notesStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error deleting note:', error);
      throw error;
    }
  },

  /**
   * Get a single note by ID
   */
  getById(id: string): INote | undefined {
    const state = get(notesStateWritable);
    return state.value.find(note => note.id === id);
  },

  /**
   * Get all notes (synchronous getter for current state)
   */
  getNotes(): INote[] {
    const state = get(notesStateWritable);
    return state.value;
  }
};

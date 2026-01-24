import { writable, derived, get } from 'svelte/store';
import type { INote } from '$lib/types';
import { NotesService } from '$lib/services';
import { SupabaseNotesService, isOnline } from '$lib/supabase';
import { getCurrentUserId } from './auth';

interface NotesState {
  value: INote[];
  loading: boolean;
  error: Error | null;
}

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
 * Notes store with actions
 *
 * When authenticated: Uses Supabase directly (no IndexedDB)
 * When guest: Uses IndexedDB only
 */
export const notesStore = {
  // Subscribe to the main state
  subscribe: notesStateWritable.subscribe,

  /**
   * Load all notes from database
   * Authenticated: Load from Supabase
   * Guest: Load from IndexedDB
   */
  async load(): Promise<void> {
    const userId = getCurrentUserId();

    try {
      notesStateWritable.update(s => ({ ...s, loading: true, error: null }));

      let value: INote[];

      if (userId && isOnline()) {
        // Authenticated + online: Load from Supabase
        value = await SupabaseNotesService.getAll(userId);
      } else if (userId && !isOnline()) {
        // Authenticated + offline: Empty state (no offline support for auth users)
        value = [];
      } else {
        // Guest mode: Load from IndexedDB
        value = await NotesService.getAll();
      }

      notesStateWritable.set({ value, loading: false, error: null });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to load notes');
      notesStateWritable.update(s => ({ ...s, loading: false, error: err }));
      console.error('Error loading notes:', error);
    }
  },

  /**
   * Set notes directly (used by sync service for realtime updates)
   * Deduplicates by ID - keeps the one with newer updatedAt
   * IMPORTANT: Only updates if user is authenticated to prevent overwriting guest data
   */
  setNotes(notes: INote[]): void {
    // CRITICAL: Only allow setNotes when user is authenticated
    // This prevents sync callbacks from overwriting guest data after logout
    const userId = getCurrentUserId();
    if (!userId) {
      console.log('setNotes skipped: user is not authenticated (guest mode)');
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
   * Authenticated: Save to Supabase only
   * Guest: Save to IndexedDB only
   */
  async add(note: INote): Promise<void> {
    const userId = getCurrentUserId();

    try {
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

      if (userId && isOnline()) {
        // Authenticated: Save to Supabase only
        const savedNote = await SupabaseNotesService.create(noteWithOrder, userId);

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
      } else if (userId && !isOnline()) {
        // Authenticated + offline: Show error (no offline support)
        throw new Error('Nincs internetkapcsolat. Kérlek próbáld újra később.');
      } else {
        // Guest mode: Save to IndexedDB only
        await NotesService.create(noteWithOrder);
        notesStateWritable.update(s => {
          if (s.value.some(n => n.id === noteWithOrder.id)) {
            return {
              ...s,
              value: s.value.map(n => n.id === noteWithOrder.id ? noteWithOrder : n)
            };
          }
          return {
            ...s,
            value: [...s.value, noteWithOrder]
          };
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to add note');
      notesStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error adding note:', error);
      throw error;
    }
  },

  /**
   * Update an existing note
   * Authenticated: Update in Supabase only
   * Guest: Update in IndexedDB only
   */
  async update(id: string, updates: Partial<Omit<INote, 'id' | 'createdAt'>>): Promise<void> {
    const userId = getCurrentUserId();

    try {
      // Only update updatedAt if it's not just an order change
      const isOnlyOrderChange = Object.keys(updates).length === 1 && 'order' in updates;

      if (userId && isOnline()) {
        // Authenticated: Update in Supabase only
        await SupabaseNotesService.update(id, updates, userId);

        // Optimistic update in store
        notesStateWritable.update(s => ({
          ...s,
          value: s.value.map(note => {
            if (note.id === id) {
              return { ...note, ...updates, ...(isOnlyOrderChange ? {} : { updatedAt: new Date() }) };
            }
            return note;
          })
        }));
      } else if (userId && !isOnline()) {
        // Authenticated + offline: Show error
        throw new Error('Nincs internetkapcsolat. Kérlek próbáld újra később.');
      } else {
        // Guest mode: Update in IndexedDB
        await NotesService.update({ id, ...updates });

        notesStateWritable.update(s => ({
          ...s,
          value: s.value.map(note => {
            if (note.id === id) {
              return { ...note, ...updates, ...(isOnlyOrderChange ? {} : { updatedAt: new Date() }) };
            }
            return note;
          })
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update note');
      notesStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error updating note:', error);
      throw error;
    }
  },

  /**
   * Delete a note
   * Authenticated: Delete from Supabase only
   * Guest: Delete from IndexedDB only
   */
  async remove(id: string): Promise<void> {
    const userId = getCurrentUserId();

    try {
      if (userId && isOnline()) {
        // Authenticated: Delete from Supabase only
        await SupabaseNotesService.delete(id, userId);

        // Optimistic update
        notesStateWritable.update(s => ({
          ...s,
          value: s.value.filter(note => note.id !== id)
        }));
      } else if (userId && !isOnline()) {
        // Authenticated + offline: Show error
        throw new Error('Nincs internetkapcsolat. Kérlek próbáld újra később.');
      } else {
        // Guest mode: Delete from IndexedDB
        await NotesService.delete(id);

        notesStateWritable.update(s => ({
          ...s,
          value: s.value.filter(note => note.id !== id)
        }));
      }
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
  }
};

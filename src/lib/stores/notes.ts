import { writable, derived, get } from 'svelte/store';
import type { INote } from '$lib/types';
import { NotesService } from '$lib/services';
import {
  SupabaseNotesService,
  addToSyncQueue,
  isOnline,
} from '$lib/supabase';
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
 */
export const notesStore = {
  // Subscribe to the main state
  subscribe: notesStateWritable.subscribe,

  /**
   * Load all notes from database
   * If online and authenticated, syncs with Supabase first
   */
  async load(): Promise<void> {
    try {
      notesStateWritable.update(s => ({ ...s, loading: true, error: null }));
      const value = await NotesService.getAll();
      notesStateWritable.set({ value, loading: false, error: null });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to load notes');
      notesStateWritable.update(s => ({ ...s, loading: false, error: err }));
      console.error('Error loading notes:', error);
    }
  },

  /**
   * Set notes directly (used by sync service)
   */
  setNotes(notes: INote[]): void {
    notesStateWritable.set({ value: notes, loading: false, error: null });
  },

  /**
   * Add a new note
   * When online + authenticated: save to Supabase only (realtime/polling syncs to local)
   * When offline or guest: save to local IndexedDB
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

      // Online + authenticated: save to Supabase ONLY (avoids duplication)
      if (userId && isOnline()) {
        try {
          const savedNote = await SupabaseNotesService.create(noteWithOrder, userId);
          // Update local store with the saved note from Supabase
          notesStateWritable.update(s => ({
            ...s,
            value: [...s.value, savedNote]
          }));
          // Also save to local IndexedDB for offline access
          await NotesService.create(savedNote);
        } catch {
          // Supabase failed - fall back to local storage + sync queue
          await NotesService.create(noteWithOrder);
          notesStateWritable.update(s => ({
            ...s,
            value: [...s.value, noteWithOrder]
          }));
          addToSyncQueue('INSERT', 'notes', noteWithOrder.id!, noteWithOrder);
          console.log('Note added to sync queue (Supabase unavailable)');
        }
      } else {
        // Offline or guest mode: save to local IndexedDB only
        await NotesService.create(noteWithOrder);
        notesStateWritable.update(s => ({
          ...s,
          value: [...s.value, noteWithOrder]
        }));
        // If authenticated but offline, add to sync queue
        if (userId) {
          addToSyncQueue('INSERT', 'notes', noteWithOrder.id!, noteWithOrder);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to add note');
      notesStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error adding note:', error);
      // Reload on error
      await this.load();
    }
  },

  /**
   * Update an existing note
   */
  async update(id: string, updates: Partial<Omit<INote, 'id' | 'createdAt'>>): Promise<void> {
    const userId = getCurrentUserId();

    try {
      await NotesService.update({ id, ...updates });

      // Optimistic update
      // Only update updatedAt if it's not just an order change
      const isOnlyOrderChange = Object.keys(updates).length === 1 && 'order' in updates;
      let updatedNote: INote | undefined;

      notesStateWritable.update(s => ({
        ...s,
        value: s.value.map(note => {
          if (note.id === id) {
            updatedNote = { ...note, ...updates, ...(isOnlyOrderChange ? {} : { updatedAt: new Date() }) };
            return updatedNote;
          }
          return note;
        })
      }));

      // Sync to Supabase if online and authenticated
      if (userId && updatedNote) {
        if (isOnline()) {
          try {
            await SupabaseNotesService.update(id, updates, userId);
          } catch {
            // Add to sync queue for later
            addToSyncQueue('UPDATE', 'notes', id, updatedNote);
            console.log('Note update added to sync queue');
          }
        } else {
          // Offline - add to sync queue
          addToSyncQueue('UPDATE', 'notes', id, updatedNote);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update note');
      notesStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error updating note:', error);
      // Reload on error
      await this.load();
    }
  },

  /**
   * Delete a note
   */
  async remove(id: string): Promise<void> {
    const userId = getCurrentUserId();

    try {
      await NotesService.delete(id);

      // Optimistic update
      notesStateWritable.update(s => ({
        ...s,
        value: s.value.filter(note => note.id !== id)
      }));

      // Sync to Supabase if online and authenticated
      if (userId) {
        if (isOnline()) {
          try {
            await SupabaseNotesService.delete(id, userId);
          } catch {
            // Add to sync queue for later
            addToSyncQueue('DELETE', 'notes', id);
            console.log('Note delete added to sync queue');
          }
        } else {
          // Offline - add to sync queue
          addToSyncQueue('DELETE', 'notes', id);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete note');
      notesStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error deleting note:', error);
      // Reload on error
      await this.load();
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

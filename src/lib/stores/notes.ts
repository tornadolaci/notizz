import { writable, derived, get } from 'svelte/store';
import type { INote } from '$lib/types';
import { NotesService } from '$lib/services';

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
export const urgentNotes = derived(notesStateWritable, ($state) =>
  $state.value.filter(note => note.isUrgent)
);

/**
 * Notes store with actions
 */
export const notesStore = {
  // Subscribe to the main state
  subscribe: notesStateWritable.subscribe,

  /**
   * Load all notes from database
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
   * Add a new note
   */
  async add(note: INote): Promise<void> {
    try {
      await NotesService.create(note);
      // Optimistic update
      notesStateWritable.update(s => ({
        ...s,
        value: [...s.value, note]
      }));
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
    try {
      await NotesService.update({ id, ...updates });
      // Optimistic update
      notesStateWritable.update(s => ({
        ...s,
        value: s.value.map(note =>
          note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
        )
      }));
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
    try {
      await NotesService.delete(id);
      // Optimistic update
      notesStateWritable.update(s => ({
        ...s,
        value: s.value.filter(note => note.id !== id)
      }));
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
  },

  /**
   * Reorder notes after drag&drop
   * Updates the order field for all affected notes
   */
  async reorder(noteIds: string[]): Promise<void> {
    try {
      // Update order in database
      const updatePromises = noteIds.map((id, index) =>
        NotesService.update({ id, order: index })
      );
      await Promise.all(updatePromises);

      // Optimistic update in state
      const state = get(notesStateWritable);
      const noteMap = new Map(state.value.map(note => [note.id, note]));
      const reorderedNotes = noteIds
        .map(id => noteMap.get(id))
        .filter((note): note is INote => note !== undefined)
        .map((note, index) => ({ ...note, order: index }));

      notesStateWritable.update(s => ({ ...s, value: reorderedNotes }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to reorder notes');
      notesStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error reordering notes:', error);
      // Reload on error
      await this.load();
    }
  }
};

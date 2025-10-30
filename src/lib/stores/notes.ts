import type { INote } from '$lib/types';
import { NotesService } from '$lib/services';

interface NotesState {
  value: INote[];
  loading: boolean;
  error: Error | null;
}

/**
 * Reactive notes store using Svelte 5 runes
 */
function createNotesStore() {
  let state = $state<NotesState>({
    value: [],
    loading: false,
    error: null
  });

  return {
    get notes() {
      return state;
    },

    /**
     * Load all notes from database
     */
    async load(): Promise<void> {
      try {
        state.loading = true;
        state.error = null;
        state.value = await NotesService.getAll();
      } catch (error) {
        state.error = error instanceof Error ? error : new Error('Failed to load notes');
        console.error('Error loading notes:', error);
      } finally {
        state.loading = false;
      }
    },

    /**
     * Add a new note
     */
    async add(note: INote): Promise<void> {
      try {
        await NotesService.create(note);
        // Optimistic update
        state.value = [...state.value, note];
      } catch (error) {
        state.error = error instanceof Error ? error : new Error('Failed to add note');
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
        state.value = state.value.map(note =>
          note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
        );
      } catch (error) {
        state.error = error instanceof Error ? error : new Error('Failed to update note');
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
        state.value = state.value.filter(note => note.id !== id);
      } catch (error) {
        state.error = error instanceof Error ? error : new Error('Failed to delete note');
        console.error('Error deleting note:', error);
        // Reload on error
        await this.load();
      }
    },

    /**
     * Get a single note by ID
     */
    getById(id: string): INote | undefined {
      return state.value.find(note => note.id === id);
    },

    /**
     * Get all urgent notes
     */
    get urgent(): INote[] {
      return state.value.filter(note => note.isUrgent);
    },

    /**
     * Filter notes by tag
     */
    filterByTag(tag: string): INote[] {
      return state.value.filter(note => note.tags.includes(tag));
    }
  };
}

export const notesStore = createNotesStore();

import { writable, derived, get } from 'svelte/store';
import type { INote, ITodo } from '$lib/types';
import { searchNotes, searchTodos, type ISearchResult } from '$lib/utils/search';

/**
 * Search filter type
 */
export type SearchFilter = 'all' | 'notes' | 'todos';

/**
 * Search state interface
 */
interface ISearchState {
  query: string;
  filter: SearchFilter;
  noteResults: ISearchResult<INote>[];
  todoResults: ISearchResult<ITodo>[];
  isActive: boolean;
}

/**
 * Internal writable store
 */
const searchStateWritable = writable<ISearchState>({
  query: '',
  filter: 'all',
  noteResults: [],
  todoResults: [],
  isActive: false
});

/**
 * Derived stores for computed values
 */
export const totalResults = derived(searchStateWritable, ($state) => {
  const noteCount = $state.filter !== 'todos' ? $state.noteResults.length : 0;
  const todoCount = $state.filter !== 'notes' ? $state.todoResults.length : 0;
  return noteCount + todoCount;
});

export const isEmpty = derived(searchStateWritable, ($state) => {
  return !$state.query.trim();
});

export const noResults = derived([totalResults, isEmpty], ([$total, $empty]) => {
  return !$empty && $total === 0;
});

export const filteredNotes = derived(searchStateWritable, ($state) => {
  return $state.filter === 'todos' ? [] : $state.noteResults;
});

export const filteredTodos = derived(searchStateWritable, ($state) => {
  return $state.filter === 'notes' ? [] : $state.todoResults;
});

/**
 * Search store with actions
 */
export const searchStore = {
  // Subscribe to the main state
  subscribe: searchStateWritable.subscribe,

  /**
   * Set search query and perform search
   */
  setQuery(query: string, notes: INote[], todos: ITodo[]): void {
    const isActive = query.trim().length > 0;

    if (!isActive) {
      searchStateWritable.set({
        query,
        filter: get(searchStateWritable).filter,
        noteResults: [],
        todoResults: [],
        isActive: false
      });
      return;
    }

    // Perform search
    const noteResults = searchNotes(notes, query);
    const todoResults = searchTodos(todos, query);

    searchStateWritable.set({
      query,
      filter: get(searchStateWritable).filter,
      noteResults,
      todoResults,
      isActive
    });
  },

  /**
   * Set search filter
   */
  setFilter(filter: SearchFilter): void {
    searchStateWritable.update((state) => ({
      ...state,
      filter
    }));
  },

  /**
   * Clear search
   */
  clear(): void {
    searchStateWritable.set({
      query: '',
      filter: 'all',
      noteResults: [],
      todoResults: [],
      isActive: false
    });
  },

  /**
   * Check if item matches current search
   */
  matchesSearch(itemId: string): boolean {
    const state = get(searchStateWritable);
    if (!state.isActive) return true;

    const noteMatch = state.noteResults.some(result => result.item.id === itemId);
    const todoMatch = state.todoResults.some(result => result.item.id === itemId);

    return noteMatch || todoMatch;
  }
};

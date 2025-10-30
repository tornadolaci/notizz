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
 * Reactive search store using Svelte 5 runes
 */
function createSearchStore() {
  let state = $state<ISearchState>({
    query: '',
    filter: 'all',
    noteResults: [],
    todoResults: [],
    isActive: false
  });

  return {
    get search() {
      return state;
    },

    /**
     * Total number of results
     */
    get totalResults(): number {
      const noteCount = state.filter !== 'todos' ? state.noteResults.length : 0;
      const todoCount = state.filter !== 'notes' ? state.todoResults.length : 0;
      return noteCount + todoCount;
    },

    /**
     * Check if search is empty
     */
    get isEmpty(): boolean {
      return !state.query.trim();
    },

    /**
     * Check if no results found
     */
    get noResults(): boolean {
      return !this.isEmpty && this.totalResults === 0;
    },

    /**
     * Get filtered note results based on current filter
     */
    get filteredNotes(): ISearchResult<INote>[] {
      return state.filter === 'todos' ? [] : state.noteResults;
    },

    /**
     * Get filtered todo results based on current filter
     */
    get filteredTodos(): ISearchResult<ITodo>[] {
      return state.filter === 'notes' ? [] : state.todoResults;
    },

    /**
     * Set search query and perform search
     */
    setQuery(query: string, notes: INote[], todos: ITodo[]): void {
      state.query = query;
      state.isActive = query.trim().length > 0;

      if (!state.isActive) {
        state.noteResults = [];
        state.todoResults = [];
        return;
      }

      // Perform search
      state.noteResults = searchNotes(notes, query);
      state.todoResults = searchTodos(todos, query);
    },

    /**
     * Set search filter
     */
    setFilter(filter: SearchFilter): void {
      state.filter = filter;
    },

    /**
     * Clear search
     */
    clear(): void {
      state.query = '';
      state.filter = 'all';
      state.noteResults = [];
      state.todoResults = [];
      state.isActive = false;
    },

    /**
     * Check if item matches current search
     */
    matchesSearch(itemId: string): boolean {
      if (!state.isActive) return true;

      const noteMatch = state.noteResults.some(result => result.item.id === itemId);
      const todoMatch = state.todoResults.some(result => result.item.id === itemId);

      return noteMatch || todoMatch;
    }
  };
}

export const searchStore = createSearchStore();

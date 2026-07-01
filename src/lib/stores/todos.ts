import { writable, derived, get } from 'svelte/store';
import type { ITodo } from '$lib/types';
import { ApiTodosService, isOnline, registerLocalModification } from '$lib/api';
import { getCurrentUserId } from './auth';

interface TodosState {
  value: ITodo[];
  loading: boolean;
  error: Error | null;
}

const OFFLINE_ERROR = 'Nincs internetkapcsolat. Kérlek próbáld újra később.';
const UNAUTHENTICATED_ERROR = 'Nincs bejelentkezett felhasználó.';

/**
 * Internal writable store
 */
const todosStateWritable = writable<TodosState>({
  value: [],
  loading: false,
  error: null
});

/**
 * Derived stores
 */
export const todosValue = derived(todosStateWritable, ($state) => $state.value);
export const todosLoading = derived(todosStateWritable, ($state) => $state.loading);
export const todosError = derived(todosStateWritable, ($state) => $state.error);
export const incompleteTodos = derived(todosStateWritable, ($state) =>
  $state.value.filter(todo => todo.completedCount < todo.totalCount)
);
export const completedTodos = derived(todosStateWritable, ($state) =>
  $state.value.filter(todo => todo.completedCount === todo.totalCount && todo.totalCount > 0)
);

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
 * Todos store with actions
 *
 * Auth-only: all data lives on the server, accessed via the API.
 * Offline: reads yield an empty list, writes fail with a Hungarian error.
 */
export const todosStore = {
  // Subscribe to the main state
  subscribe: todosStateWritable.subscribe,

  /**
   * Load all todos from the API
   */
  async load(): Promise<void> {
    const userId = getCurrentUserId();

    try {
      todosStateWritable.update(s => ({ ...s, loading: true, error: null }));

      // Not authenticated or offline: nothing to load (the auth gate handles the UI)
      const value = userId && isOnline() ? await ApiTodosService.getAll() : [];

      todosStateWritable.set({ value, loading: false, error: null });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to load todos');
      todosStateWritable.update(s => ({ ...s, loading: false, error: err }));
      console.error('Error loading todos:', error);
    }
  },

  /**
   * Set todos directly (used by the sync service for polling updates)
   * Deduplicates by ID - keeps the one with newer updatedAt
   * IMPORTANT: Only updates if user is authenticated to prevent
   * stale sync callbacks from firing after logout
   */
  setTodos(todos: ITodo[]): void {
    const userId = getCurrentUserId();
    if (!userId) {
      return;
    }

    // Deduplicate by ID - keep the one with newer updatedAt
    const uniqueMap = new Map<string, ITodo>();
    for (const todo of todos) {
      if (todo.id) {
        const existing = uniqueMap.get(todo.id);
        if (!existing || new Date(todo.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
          uniqueMap.set(todo.id, todo);
        }
      }
    }
    todosStateWritable.set({
      value: Array.from(uniqueMap.values()),
      loading: false,
      error: null
    });
  },

  /**
   * Add a new todo
   */
  async add(todo: ITodo): Promise<void> {
    try {
      requireOnlineUser();

      // Calculate order to place new todo at the top
      const state = get(todosStateWritable);
      const minOrder = state.value.length > 0
        ? Math.min(...state.value.map(t => t.order))
        : Date.now();

      // New todo gets minimum order - 1000 (or Date.now() if first todo)
      const todoWithOrder = {
        ...todo,
        order: state.value.length > 0 ? minOrder - 1000 : minOrder
      };

      // Register as local modification BEFORE the API call to prevent self-notification
      // (polling might fire before we get the response)
      registerLocalModification('todo', todoWithOrder.id!, todoWithOrder.updatedAt);

      const savedTodo = await ApiTodosService.create(todoWithOrder);

      // Update store with the saved todo
      todosStateWritable.update(s => {
        if (s.value.some(t => t.id === savedTodo.id)) {
          return {
            ...s,
            value: s.value.map(t => t.id === savedTodo.id ? savedTodo : t)
          };
        }
        return {
          ...s,
          value: [...s.value, savedTodo]
        };
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to add todo');
      todosStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error adding todo:', error);
      throw error;
    }
  },

  /**
   * Update an existing todo
   */
  async update(id: string, updates: Partial<Omit<ITodo, 'id' | 'createdAt'>>): Promise<void> {
    try {
      requireOnlineUser();

      // Only update updatedAt if it's not just an order change
      const isOnlyOrderChange = Object.keys(updates).length === 1 && 'order' in updates;
      const newUpdatedAt = isOnlyOrderChange ? undefined : new Date();

      // Register as local modification BEFORE the API call to prevent self-notification
      // (polling might fire before we get the response)
      if (!isOnlyOrderChange) {
        registerLocalModification('todo', id, newUpdatedAt!);
      }

      await ApiTodosService.update(id, updates);

      // Optimistic update in store
      todosStateWritable.update(s => ({
        ...s,
        value: s.value.map(todo => {
          if (todo.id === id) {
            return { ...todo, ...updates, ...(isOnlyOrderChange ? {} : { updatedAt: newUpdatedAt! }) };
          }
          return todo;
        })
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update todo');
      todosStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error updating todo:', error);
      throw error;
    }
  },

  /**
   * Delete a todo
   */
  async remove(id: string): Promise<void> {
    try {
      requireOnlineUser();

      await ApiTodosService.delete(id);

      // Optimistic update
      todosStateWritable.update(s => ({
        ...s,
        value: s.value.filter(todo => todo.id !== id)
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete todo');
      todosStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error deleting todo:', error);
      throw error;
    }
  },

  /**
   * Toggle a todo item's completed status
   */
  async toggleItem(todoId: string, itemId: string): Promise<void> {
    try {
      requireOnlineUser();

      // Get current todo to compute new state
      const state = get(todosStateWritable);
      const todo = state.value.find(t => t.id === todoId);
      if (!todo) {
        throw new Error('Todo not found');
      }

      // Compute updated items
      const updatedItems = todo.items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      const completedCount = updatedItems.filter(item => item.completed).length;

      const updates = {
        items: updatedItems,
        completedCount,
        updatedAt: new Date()
      };

      // Register as local modification BEFORE the API call to prevent self-notification
      // (polling might fire before we get the response)
      registerLocalModification('todo', todoId, updates.updatedAt);

      // updatedAt is sent too, so other devices' change detection picks up the toggle
      await ApiTodosService.update(todoId, {
        items: updatedItems,
        completedCount,
        updatedAt: updates.updatedAt,
      });

      // Optimistic update in store
      todosStateWritable.update(s => ({
        ...s,
        value: s.value.map(t => {
          if (t.id === todoId) {
            return { ...t, ...updates };
          }
          return t;
        })
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to toggle todo item');
      todosStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error toggling todo item:', error);
      throw error;
    }
  },

  /**
   * Get a single todo by ID
   */
  getById(id: string): ITodo | undefined {
    const state = get(todosStateWritable);
    return state.value.find(todo => todo.id === id);
  },

  /**
   * Get all todos (synchronous getter for current state)
   */
  getTodos(): ITodo[] {
    const state = get(todosStateWritable);
    return state.value;
  }
};

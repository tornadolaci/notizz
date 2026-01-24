import { writable, derived, get } from 'svelte/store';
import type { ITodo } from '$lib/types';
import { TodosService } from '$lib/services';
import { SupabaseTodosService, isOnline } from '$lib/supabase';
import { getCurrentUserId } from './auth';

interface TodosState {
  value: ITodo[];
  loading: boolean;
  error: Error | null;
}

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
 * Todos store with actions
 *
 * When authenticated: Uses Supabase directly (no IndexedDB)
 * When guest: Uses IndexedDB only
 */
export const todosStore = {
  // Subscribe to the main state
  subscribe: todosStateWritable.subscribe,

  /**
   * Load all todos from database
   * Authenticated: Load from Supabase
   * Guest: Load from IndexedDB
   */
  async load(): Promise<void> {
    const userId = getCurrentUserId();

    try {
      todosStateWritable.update(s => ({ ...s, loading: true, error: null }));

      let value: ITodo[];

      if (userId && isOnline()) {
        // Authenticated + online: Load from Supabase
        value = await SupabaseTodosService.getAll(userId);
      } else if (userId && !isOnline()) {
        // Authenticated + offline: Empty state (no offline support for auth users)
        value = [];
      } else {
        // Guest mode: Load from IndexedDB
        value = await TodosService.getAll();
      }

      todosStateWritable.set({ value, loading: false, error: null });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to load todos');
      todosStateWritable.update(s => ({ ...s, loading: false, error: err }));
      console.error('Error loading todos:', error);
    }
  },

  /**
   * Set todos directly (used by sync service for realtime updates)
   * Deduplicates by ID - keeps the one with newer updatedAt
   * IMPORTANT: Only updates if user is authenticated to prevent overwriting guest data
   */
  setTodos(todos: ITodo[]): void {
    // CRITICAL: Only allow setTodos when user is authenticated
    // This prevents sync callbacks from overwriting guest data after logout
    const userId = getCurrentUserId();
    if (!userId) {
      console.log('setTodos skipped: user is not authenticated (guest mode)');
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
   * Authenticated: Save to Supabase only
   * Guest: Save to IndexedDB only
   */
  async add(todo: ITodo): Promise<void> {
    const userId = getCurrentUserId();

    try {
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

      if (userId && isOnline()) {
        // Authenticated: Save to Supabase only
        const savedTodo = await SupabaseTodosService.create(todoWithOrder, userId);

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
      } else if (userId && !isOnline()) {
        // Authenticated + offline: Show error (no offline support)
        throw new Error('Nincs internetkapcsolat. Kérlek próbáld újra később.');
      } else {
        // Guest mode: Save to IndexedDB only
        await TodosService.create(todoWithOrder);
        todosStateWritable.update(s => {
          if (s.value.some(t => t.id === todoWithOrder.id)) {
            return {
              ...s,
              value: s.value.map(t => t.id === todoWithOrder.id ? todoWithOrder : t)
            };
          }
          return {
            ...s,
            value: [...s.value, todoWithOrder]
          };
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to add todo');
      todosStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error adding todo:', error);
      throw error;
    }
  },

  /**
   * Update an existing todo
   * Authenticated: Update in Supabase only
   * Guest: Update in IndexedDB only
   */
  async update(id: string, updates: Partial<Omit<ITodo, 'id' | 'createdAt'>>): Promise<void> {
    const userId = getCurrentUserId();

    try {
      // Only update updatedAt if it's not just an order change
      const isOnlyOrderChange = Object.keys(updates).length === 1 && 'order' in updates;

      if (userId && isOnline()) {
        // Authenticated: Update in Supabase only
        await SupabaseTodosService.update(id, updates, userId);

        // Optimistic update in store
        todosStateWritable.update(s => ({
          ...s,
          value: s.value.map(todo => {
            if (todo.id === id) {
              return { ...todo, ...updates, ...(isOnlyOrderChange ? {} : { updatedAt: new Date() }) };
            }
            return todo;
          })
        }));
      } else if (userId && !isOnline()) {
        // Authenticated + offline: Show error
        throw new Error('Nincs internetkapcsolat. Kérlek próbáld újra később.');
      } else {
        // Guest mode: Update in IndexedDB
        await TodosService.update({ id, ...updates });

        todosStateWritable.update(s => ({
          ...s,
          value: s.value.map(todo => {
            if (todo.id === id) {
              return { ...todo, ...updates, ...(isOnlyOrderChange ? {} : { updatedAt: new Date() }) };
            }
            return todo;
          })
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update todo');
      todosStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error updating todo:', error);
      throw error;
    }
  },

  /**
   * Delete a todo
   * Authenticated: Delete from Supabase only
   * Guest: Delete from IndexedDB only
   */
  async remove(id: string): Promise<void> {
    const userId = getCurrentUserId();

    try {
      if (userId && isOnline()) {
        // Authenticated: Delete from Supabase only
        await SupabaseTodosService.delete(id, userId);

        // Optimistic update
        todosStateWritable.update(s => ({
          ...s,
          value: s.value.filter(todo => todo.id !== id)
        }));
      } else if (userId && !isOnline()) {
        // Authenticated + offline: Show error
        throw new Error('Nincs internetkapcsolat. Kérlek próbáld újra później.');
      } else {
        // Guest mode: Delete from IndexedDB
        await TodosService.delete(id);

        todosStateWritable.update(s => ({
          ...s,
          value: s.value.filter(todo => todo.id !== id)
        }));
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete todo');
      todosStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error deleting todo:', error);
      throw error;
    }
  },

  /**
   * Toggle a todo item's completed status
   * Authenticated: Update in Supabase only
   * Guest: Update in IndexedDB only
   */
  async toggleItem(todoId: string, itemId: string): Promise<void> {
    const userId = getCurrentUserId();

    try {
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

      if (userId && isOnline()) {
        // Authenticated: Update in Supabase only
        await SupabaseTodosService.update(todoId, {
          items: updatedItems,
          completedCount,
        }, userId);

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
      } else if (userId && !isOnline()) {
        // Authenticated + offline: Show error
        throw new Error('Nincs internetkapcsolat. Kérlek próbáld újra később.');
      } else {
        // Guest mode: Update in IndexedDB
        await TodosService.toggleItem(todoId, itemId);

        todosStateWritable.update(s => ({
          ...s,
          value: s.value.map(t => {
            if (t.id === todoId) {
              return { ...t, ...updates };
            }
            return t;
          })
        }));
      }
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
  }
};

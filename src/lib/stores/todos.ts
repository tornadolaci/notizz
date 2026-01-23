import { writable, derived, get } from 'svelte/store';
import type { ITodo } from '$lib/types';
import { TodosService } from '$lib/services';
import {
  SupabaseTodosService,
  addToSyncQueue,
  isOnline,
} from '$lib/supabase';
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
 */
export const todosStore = {
  // Subscribe to the main state
  subscribe: todosStateWritable.subscribe,

  /**
   * Load all todos from database
   */
  async load(): Promise<void> {
    try {
      todosStateWritable.update(s => ({ ...s, loading: true, error: null }));
      const value = await TodosService.getAll();
      todosStateWritable.set({ value, loading: false, error: null });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to load todos');
      todosStateWritable.update(s => ({ ...s, loading: false, error: err }));
      console.error('Error loading todos:', error);
    }
  },

  /**
   * Set todos directly (used by sync service)
   */
  setTodos(todos: ITodo[]): void {
    todosStateWritable.set({ value: todos, loading: false, error: null });
  },

  /**
   * Add a new todo
   * When online + authenticated: save to Supabase only (realtime/polling syncs to local)
   * When offline or guest: save to local IndexedDB
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

      // Online + authenticated: save to Supabase ONLY (avoids duplication)
      if (userId && isOnline()) {
        try {
          const savedTodo = await SupabaseTodosService.create(todoWithOrder, userId);
          // Update local store with the saved todo from Supabase
          todosStateWritable.update(s => ({
            ...s,
            value: [...s.value, savedTodo]
          }));
          // Also save to local IndexedDB for offline access
          await TodosService.create(savedTodo);
        } catch {
          // Supabase failed - fall back to local storage + sync queue
          await TodosService.create(todoWithOrder);
          todosStateWritable.update(s => ({
            ...s,
            value: [...s.value, todoWithOrder]
          }));
          addToSyncQueue('INSERT', 'todos', todoWithOrder.id!, todoWithOrder);
          console.log('Todo added to sync queue (Supabase unavailable)');
        }
      } else {
        // Offline or guest mode: save to local IndexedDB only
        await TodosService.create(todoWithOrder);
        todosStateWritable.update(s => ({
          ...s,
          value: [...s.value, todoWithOrder]
        }));
        // If authenticated but offline, add to sync queue
        if (userId) {
          addToSyncQueue('INSERT', 'todos', todoWithOrder.id!, todoWithOrder);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to add todo');
      todosStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error adding todo:', error);
      // Reload on error
      await this.load();
    }
  },

  /**
   * Update an existing todo
   */
  async update(id: string, updates: Partial<Omit<ITodo, 'id' | 'createdAt'>>): Promise<void> {
    const userId = getCurrentUserId();

    try {
      await TodosService.update({ id, ...updates });
      // Optimistic update
      // Only update updatedAt if it's not just an order change
      const isOnlyOrderChange = Object.keys(updates).length === 1 && 'order' in updates;
      let updatedTodo: ITodo | undefined;

      todosStateWritable.update(s => ({
        ...s,
        value: s.value.map(todo => {
          if (todo.id === id) {
            updatedTodo = { ...todo, ...updates, ...(isOnlyOrderChange ? {} : { updatedAt: new Date() }) };
            return updatedTodo;
          }
          return todo;
        })
      }));

      // Sync to Supabase if online and authenticated
      if (userId && updatedTodo) {
        if (isOnline()) {
          try {
            await SupabaseTodosService.update(id, updates, userId);
          } catch {
            // Add to sync queue for later
            addToSyncQueue('UPDATE', 'todos', id, updatedTodo);
            console.log('Todo update added to sync queue');
          }
        } else {
          // Offline - add to sync queue
          addToSyncQueue('UPDATE', 'todos', id, updatedTodo);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to update todo');
      todosStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error updating todo:', error);
      // Reload on error
      await this.load();
    }
  },

  /**
   * Delete a todo
   */
  async remove(id: string): Promise<void> {
    const userId = getCurrentUserId();

    try {
      await TodosService.delete(id);
      // Optimistic update
      todosStateWritable.update(s => ({
        ...s,
        value: s.value.filter(todo => todo.id !== id)
      }));

      // Sync to Supabase if online and authenticated
      if (userId) {
        if (isOnline()) {
          try {
            await SupabaseTodosService.delete(id, userId);
          } catch {
            // Add to sync queue for later
            addToSyncQueue('DELETE', 'todos', id);
            console.log('Todo delete added to sync queue');
          }
        } else {
          // Offline - add to sync queue
          addToSyncQueue('DELETE', 'todos', id);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to delete todo');
      todosStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error deleting todo:', error);
      // Reload on error
      await this.load();
    }
  },

  /**
   * Toggle a todo item's completed status
   */
  async toggleItem(todoId: string, itemId: string): Promise<void> {
    const userId = getCurrentUserId();

    try {
      await TodosService.toggleItem(todoId, itemId);

      // Optimistic update
      let updatedTodo: ITodo | undefined;

      todosStateWritable.update(s => ({
        ...s,
        value: s.value.map(todo => {
          if (todo.id === todoId) {
            const updatedItems = todo.items.map(item =>
              item.id === itemId ? { ...item, completed: !item.completed } : item
            );
            const completedCount = updatedItems.filter(item => item.completed).length;

            updatedTodo = {
              ...todo,
              items: updatedItems,
              completedCount,
              updatedAt: new Date()
            };
            return updatedTodo;
          }
          return todo;
        })
      }));

      // Sync to Supabase if online and authenticated
      if (userId && updatedTodo) {
        if (isOnline()) {
          try {
            await SupabaseTodosService.update(todoId, {
              items: updatedTodo.items,
              completedCount: updatedTodo.completedCount,
            }, userId);
          } catch {
            // Add to sync queue for later
            addToSyncQueue('UPDATE', 'todos', todoId, updatedTodo);
            console.log('Todo toggle added to sync queue');
          }
        } else {
          // Offline - add to sync queue
          addToSyncQueue('UPDATE', 'todos', todoId, updatedTodo);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to toggle todo item');
      todosStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error toggling todo item:', error);
      // Reload on error
      await this.load();
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

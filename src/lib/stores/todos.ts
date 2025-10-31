import { writable, derived, get } from 'svelte/store';
import type { ITodo } from '$lib/types';
import { TodosService } from '$lib/services';

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
export const urgentTodos = derived(todosStateWritable, ($state) =>
  $state.value.filter(todo => todo.isUrgent)
);
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
   * Add a new todo
   */
  async add(todo: ITodo): Promise<void> {
    try {
      await TodosService.create(todo);
      // Optimistic update
      todosStateWritable.update(s => ({
        ...s,
        value: [...s.value, todo]
      }));
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
    try {
      await TodosService.update({ id, ...updates });
      // Optimistic update
      todosStateWritable.update(s => ({
        ...s,
        value: s.value.map(todo =>
          todo.id === id ? { ...todo, ...updates, updatedAt: new Date() } : todo
        )
      }));
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
    try {
      await TodosService.delete(id);
      // Optimistic update
      todosStateWritable.update(s => ({
        ...s,
        value: s.value.filter(todo => todo.id !== id)
      }));
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
    try {
      await TodosService.toggleItem(todoId, itemId);

      // Optimistic update
      todosStateWritable.update(s => ({
        ...s,
        value: s.value.map(todo => {
          if (todo.id === todoId) {
            const updatedItems = todo.items.map(item =>
              item.id === itemId ? { ...item, completed: !item.completed } : item
            );
            const completedCount = updatedItems.filter(item => item.completed).length;

            return {
              ...todo,
              items: updatedItems,
              completedCount,
              updatedAt: new Date()
            };
          }
          return todo;
        })
      }));
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
  },

  /**
   * Reorder todos after drag&drop
   * Updates the order field for all affected todos
   */
  async reorder(todoIds: string[]): Promise<void> {
    try {
      // Update order in database
      const updatePromises = todoIds.map((id, index) =>
        TodosService.update({ id, order: index })
      );
      await Promise.all(updatePromises);

      // Optimistic update in state
      const state = get(todosStateWritable);
      const todoMap = new Map(state.value.map(todo => [todo.id, todo]));
      const reorderedTodos = todoIds
        .map(id => todoMap.get(id))
        .filter((todo): todo is ITodo => todo !== undefined)
        .map((todo, index) => ({ ...todo, order: index }));

      todosStateWritable.update(s => ({ ...s, value: reorderedTodos }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to reorder todos');
      todosStateWritable.update(s => ({ ...s, error: err }));
      console.error('Error reordering todos:', error);
      // Reload on error
      await this.load();
    }
  }
};

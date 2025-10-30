import type { ITodo } from '$lib/types';
import { TodosService } from '$lib/services';

interface TodosState {
  value: ITodo[];
  loading: boolean;
  error: Error | null;
}

/**
 * Reactive todos store using Svelte 5 runes
 */
function createTodosStore() {
  let state = $state<TodosState>({
    value: [],
    loading: false,
    error: null
  });

  return {
    get todos() {
      return state;
    },

    /**
     * Load all todos from database
     */
    async load(): Promise<void> {
      try {
        state.loading = true;
        state.error = null;
        state.value = await TodosService.getAll();
      } catch (error) {
        state.error = error instanceof Error ? error : new Error('Failed to load todos');
        console.error('Error loading todos:', error);
      } finally {
        state.loading = false;
      }
    },

    /**
     * Add a new todo
     */
    async add(todo: ITodo): Promise<void> {
      try {
        await TodosService.create(todo);
        // Optimistic update
        state.value = [...state.value, todo];
      } catch (error) {
        state.error = error instanceof Error ? error : new Error('Failed to add todo');
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
        state.value = state.value.map(todo =>
          todo.id === id ? { ...todo, ...updates, updatedAt: new Date() } : todo
        );
      } catch (error) {
        state.error = error instanceof Error ? error : new Error('Failed to update todo');
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
        state.value = state.value.filter(todo => todo.id !== id);
      } catch (error) {
        state.error = error instanceof Error ? error : new Error('Failed to delete todo');
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
        state.value = state.value.map(todo => {
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
        });
      } catch (error) {
        state.error = error instanceof Error ? error : new Error('Failed to toggle todo item');
        console.error('Error toggling todo item:', error);
        // Reload on error
        await this.load();
      }
    },

    /**
     * Get a single todo by ID
     */
    getById(id: string): ITodo | undefined {
      return state.value.find(todo => todo.id === id);
    },

    /**
     * Get all urgent todos
     */
    get urgent(): ITodo[] {
      return state.value.filter(todo => todo.isUrgent);
    },

    /**
     * Get all incomplete todos
     */
    get incomplete(): ITodo[] {
      return state.value.filter(todo => todo.completedCount < todo.totalCount);
    },

    /**
     * Get all completed todos
     */
    get completed(): ITodo[] {
      return state.value.filter(todo => todo.completedCount === todo.totalCount && todo.totalCount > 0);
    },

    /**
     * Filter todos by tag
     */
    filterByTag(tag: string): ITodo[] {
      return state.value.filter(todo => todo.tags.includes(tag));
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
        const todoMap = new Map(state.value.map(todo => [todo.id, todo]));
        state.value = todoIds
          .map(id => todoMap.get(id))
          .filter((todo): todo is ITodo => todo !== undefined)
          .map((todo, index) => ({ ...todo, order: index }));

      } catch (error) {
        state.error = error instanceof Error ? error : new Error('Failed to reorder todos');
        console.error('Error reordering todos:', error);
        // Reload on error
        await this.load();
      }
    }
  };
}

export const todosStore = createTodosStore();

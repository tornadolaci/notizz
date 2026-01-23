/**
 * Storage Service
 * Provides CRUD operations for Notes, Todos, and Settings
 * All operations include error handling and data validation
 */

import { db } from '../db';
import type {
  INote,
  ITodo,
  ISettings,
  NoteCreateInput,
  NoteUpdateInput,
  TodoCreateInput,
  TodoUpdateInput,
  ITodoItem,
  INoteFilter,
  ITodoFilter,
} from '../types';
import {
  NoteCreateSchema,
  NoteUpdateSchema,
  TodoCreateSchema,
  TodoUpdateSchema,
  SettingsUpdateSchema,
} from '../schemas';
import { generateUUID } from '../utils/uuid';

/**
 * Notes Storage Service
 */
export class NotesService {
  /**
   * Create a new note
   */
  static async create(input: NoteCreateInput): Promise<INote> {
    try {
      // Validate input
      const validatedInput = NoteCreateSchema.parse(input);

      const now = new Date();
      const note: INote = {
        id: generateUUID(),
        ...validatedInput,
        createdAt: now,
        updatedAt: now,
        order: now.getTime(), // Use timestamp as initial order
      };

      await db.notes.add(note);
      return note;
    } catch (error) {
      console.error('[NotesService] Failed to create note:', error);
      throw error;
    }
  }

  /**
   * Get a note by ID
   */
  static async getById(id: string): Promise<INote | undefined> {
    try {
      return await db.notes.get(id);
    } catch (error) {
      console.error('[NotesService] Failed to get note:', error);
      throw error;
    }
  }

  /**
   * Get all notes
   * Sorts by order (ascending - lower order values appear first)
   */
  static async getAll(): Promise<INote[]> {
    try {
      const notes = await db.notes.toArray();
      return notes.sort((a, b) => {
        return a.order - b.order;
      });
    } catch (error) {
      console.error('[NotesService] Failed to get all notes:', error);
      throw error;
    }
  }

  /**
   * Get filtered notes
   */
  static async getFiltered(filter: INoteFilter): Promise<INote[]> {
    try {
      let collection = db.notes.toCollection();

      // Filter by color
      if (filter.color) {
        const allNotes = await collection.toArray();
        return allNotes.filter((note) => note.color === filter.color);
      }

      // Filter by search term
      if (filter.searchTerm) {
        const allNotes = await collection.toArray();
        const searchLower = filter.searchTerm.toLowerCase();
        return allNotes.filter(
          (note) =>
            note.title.toLowerCase().includes(searchLower) ||
            note.content.toLowerCase().includes(searchLower)
        );
      }

      return await collection.reverse().sortBy('updatedAt');
    } catch (error) {
      console.error('[NotesService] Failed to filter notes:', error);
      throw error;
    }
  }

  /**
   * Update a note
   */
  static async update(input: NoteUpdateInput): Promise<INote | undefined> {
    try {
      // Validate input
      const validatedInput = NoteUpdateSchema.parse(input);

      const { id, ...updates } = validatedInput;

      // Only update updatedAt if it's not just an order change
      const isOnlyOrderChange = Object.keys(updates).length === 1 && 'order' in updates;

      await db.notes.update(id, {
        ...updates,
        ...(isOnlyOrderChange ? {} : { updatedAt: new Date() }),
      });

      return await db.notes.get(id);
    } catch (error) {
      console.error('[NotesService] Failed to update note:', error);
      throw error;
    }
  }

  /**
   * Delete a note by ID
   */
  static async delete(id: string): Promise<void> {
    try {
      await db.notes.delete(id);
    } catch (error) {
      console.error('[NotesService] Failed to delete note:', error);
      throw error;
    }
  }

  /**
   * Delete all notes
   */
  static async deleteAll(): Promise<void> {
    try {
      await db.notes.clear();
    } catch (error) {
      console.error('[NotesService] Failed to delete all notes:', error);
      throw error;
    }
  }
}

/**
 * Todos Storage Service
 */
export class TodosService {
  /**
   * Calculate completed and total counts
   */
  private static calculateCounts(items: ITodoItem[]): {
    completedCount: number;
    totalCount: number;
  } {
    return {
      completedCount: items.filter((item) => item.completed).length,
      totalCount: items.length,
    };
  }

  /**
   * Create a new todo
   */
  static async create(input: TodoCreateInput): Promise<ITodo> {
    try {
      // Validate input
      const validatedInput = TodoCreateSchema.parse(input);

      const now = new Date();
      const counts = this.calculateCounts(validatedInput.items);

      const todo: ITodo = {
        id: generateUUID(),
        ...validatedInput,
        createdAt: now,
        updatedAt: now,
        order: now.getTime(), // Use timestamp as initial order
        ...counts,
      };

      await db.todos.add(todo);
      return todo;
    } catch (error) {
      console.error('[TodosService] Failed to create todo:', error);
      throw error;
    }
  }

  /**
   * Get a todo by ID
   */
  static async getById(id: string): Promise<ITodo | undefined> {
    try {
      return await db.todos.get(id);
    } catch (error) {
      console.error('[TodosService] Failed to get todo:', error);
      throw error;
    }
  }

  /**
   * Get all todos
   * Sorts by order (ascending - lower order values appear first)
   */
  static async getAll(): Promise<ITodo[]> {
    try {
      const todos = await db.todos.toArray();
      // Ensure items[].createdAt are Date objects (may be strings from Supabase sync)
      const normalizedTodos = todos.map(todo => ({
        ...todo,
        items: todo.items.map(item => ({
          ...item,
          createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt as unknown as string),
        })),
      }));
      return normalizedTodos.sort((a, b) => {
        return a.order - b.order;
      });
    } catch (error) {
      console.error('[TodosService] Failed to get all todos:', error);
      throw error;
    }
  }

  /**
   * Get filtered todos
   */
  static async getFiltered(filter: ITodoFilter): Promise<ITodo[]> {
    try {
      let collection = db.todos.toCollection();

      // Filter by color
      if (filter.color) {
        const allTodos = await collection.toArray();
        return allTodos.filter((todo) => todo.color === filter.color);
      }

      // Filter by completion status
      if (filter.completed !== undefined) {
        const allTodos = await collection.toArray();
        return allTodos.filter((todo) =>
          filter.completed
            ? todo.completedCount === todo.totalCount && todo.totalCount > 0
            : todo.completedCount < todo.totalCount
        );
      }

      // Filter by search term
      if (filter.searchTerm) {
        const allTodos = await collection.toArray();
        const searchLower = filter.searchTerm.toLowerCase();
        return allTodos.filter(
          (todo) =>
            todo.title.toLowerCase().includes(searchLower) ||
            todo.items.some((item) => item.text.toLowerCase().includes(searchLower))
        );
      }

      return await collection.reverse().sortBy('updatedAt');
    } catch (error) {
      console.error('[TodosService] Failed to filter todos:', error);
      throw error;
    }
  }

  /**
   * Update a todo
   */
  static async update(input: TodoUpdateInput): Promise<ITodo | undefined> {
    try {
      // Validate input
      const validatedInput = TodoUpdateSchema.parse(input);

      const { id, items, ...updates } = validatedInput;

      // Recalculate counts if items changed
      const counts = items ? this.calculateCounts(items) : {};

      // Only update updatedAt if it's not just an order change
      const isOnlyOrderChange = Object.keys(validatedInput).length === 2 && 'order' in validatedInput && 'id' in validatedInput;

      await db.todos.update(id, {
        ...updates,
        ...(items && { items }),
        ...counts,
        ...(isOnlyOrderChange ? {} : { updatedAt: new Date() }),
      });

      return await db.todos.get(id);
    } catch (error) {
      console.error('[TodosService] Failed to update todo:', error);
      throw error;
    }
  }

  /**
   * Delete a todo by ID
   */
  static async delete(id: string): Promise<void> {
    try {
      await db.todos.delete(id);
    } catch (error) {
      console.error('[TodosService] Failed to delete todo:', error);
      throw error;
    }
  }

  /**
   * Delete all todos
   */
  static async deleteAll(): Promise<void> {
    try {
      await db.todos.clear();
    } catch (error) {
      console.error('[TodosService] Failed to delete all todos:', error);
      throw error;
    }
  }

  /**
   * Toggle todo item completion status
   */
  static async toggleItem(todoId: string, itemId: string): Promise<ITodo | undefined> {
    try {
      const todo = await db.todos.get(todoId);
      if (!todo) {
        throw new Error(`Todo with id ${todoId} not found`);
      }

      const updatedItems = todo.items.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );

      const counts = this.calculateCounts(updatedItems);

      await db.todos.update(todoId, {
        items: updatedItems,
        ...counts,
        updatedAt: new Date(),
      });

      return await db.todos.get(todoId);
    } catch (error) {
      console.error('[TodosService] Failed to toggle item:', error);
      throw error;
    }
  }
}

/**
 * Settings Storage Service
 */
export class SettingsService {
  /**
   * Get settings
   */
  static async get(): Promise<ISettings | undefined> {
    try {
      return await db.settings.get('user-settings');
    } catch (error) {
      console.error('[SettingsService] Failed to get settings:', error);
      throw error;
    }
  }

  /**
   * Update settings
   */
  static async update(
    updates: Partial<Omit<ISettings, 'id'>>
  ): Promise<ISettings | undefined> {
    try {
      // Validate input
      const validatedInput = SettingsUpdateSchema.parse({
        id: 'user-settings',
        ...updates,
      });

      const { id, ...validatedUpdates } = validatedInput;

      await db.settings.update(id, validatedUpdates);

      return await db.settings.get(id);
    } catch (error) {
      console.error('[SettingsService] Failed to update settings:', error);
      throw error;
    }
  }

  /**
   * Reset settings to default
   */
  static async reset(): Promise<ISettings> {
    try {
      const { DEFAULT_SETTINGS } = await import('../types');
      await db.settings.put(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('[SettingsService] Failed to reset settings:', error);
      throw error;
    }
  }
}

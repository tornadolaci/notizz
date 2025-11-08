/**
 * Database Schema Definition
 * Defines the Dexie database schema and version migrations
 */

import Dexie, { type EntityTable } from 'dexie';
import type { INote, ITodo, ISettings } from '../types';

/**
 * NotizzDB class extends Dexie with typed tables
 */
export class NotizzDB extends Dexie {
  // Declare typed tables
  notes!: EntityTable<INote, 'id'>;
  todos!: EntityTable<ITodo, 'id'>;
  settings!: EntityTable<ISettings, 'id'>;

  constructor() {
    super('NotizzDatabase');

    // Version 1: Initial schema
    this.version(1).stores({
      // Notes table
      // Primary key: id (string UUID)
      // Indexes: updatedAt (for sorting), isUrgent (for filtering)
      notes: 'id, updatedAt, isUrgent',

      // Todos table
      // Primary key: id (string UUID)
      // Indexes: updatedAt (for sorting), isUrgent (for filtering)
      todos: 'id, updatedAt, isUrgent',

      // Settings table
      // Primary key: id (fixed: 'user-settings')
      // No additional indexes needed (singleton pattern)
      settings: 'id',
    });

    // Version 2: Add order field for drag&drop sorting
    this.version(2).stores({
      notes: 'id, updatedAt, isUrgent, order',
      todos: 'id, updatedAt, isUrgent, order',
      settings: 'id',
    }).upgrade(async (tx) => {
      // Migrate existing data: add order field based on current updatedAt
      const notes = await tx.table('notes').toArray();
      const todos = await tx.table('todos').toArray();

      // Sort by updatedAt and assign order values
      const sortedNotes = notes.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      const sortedTodos = todos.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      // Update notes with order
      for (let i = 0; i < sortedNotes.length; i++) {
        await tx.table('notes').update(sortedNotes[i].id, { order: i });
      }

      // Update todos with order
      for (let i = 0; i < sortedTodos.length; i++) {
        await tx.table('todos').update(sortedTodos[i].id, { order: i });
      }
    });

    // Version 3: Remove isUrgent field and index
    this.version(3).stores({
      notes: 'id, updatedAt, order',
      todos: 'id, updatedAt, order',
      settings: 'id',
    }).upgrade(async (tx) => {
      // Remove isUrgent field from existing data
      const notes = await tx.table('notes').toArray();
      const todos = await tx.table('todos').toArray();

      // Remove isUrgent from notes
      for (const note of notes) {
        if ('isUrgent' in note) {
          const { isUrgent, ...noteWithoutUrgent } = note as any;
          await tx.table('notes').put(noteWithoutUrgent);
        }
      }

      // Remove isUrgent from todos
      for (const todo of todos) {
        if ('isUrgent' in todo) {
          const { isUrgent, ...todoWithoutUrgent } = todo as any;
          await tx.table('todos').put(todoWithoutUrgent);
        }
      }
    });
  }
}

/**
 * Database instance - singleton pattern
 */
export const db = new NotizzDB();

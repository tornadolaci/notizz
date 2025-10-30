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
      // Indexes: updatedAt (for sorting), isUrgent (for filtering), tags (multi-entry index)
      notes: 'id, updatedAt, isUrgent, *tags',

      // Todos table
      // Primary key: id (string UUID)
      // Indexes: updatedAt (for sorting), isUrgent (for filtering), tags (multi-entry index)
      todos: 'id, updatedAt, isUrgent, *tags',

      // Settings table
      // Primary key: id (fixed: 'user-settings')
      // No additional indexes needed (singleton pattern)
      settings: 'id',
    });

    // Version 2: Add order field for drag&drop sorting
    this.version(2).stores({
      notes: 'id, updatedAt, isUrgent, *tags, order',
      todos: 'id, updatedAt, isUrgent, *tags, order',
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
  }
}

/**
 * Database instance - singleton pattern
 */
export const db = new NotizzDB();

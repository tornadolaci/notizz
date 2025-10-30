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
  }
}

/**
 * Database instance - singleton pattern
 */
export const db = new NotizzDB();

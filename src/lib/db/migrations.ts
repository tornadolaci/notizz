/**
 * Database Migrations
 * Handles database version upgrades and data migrations
 */

import { db } from './schema';
import { DEFAULT_SETTINGS } from '../types';

/**
 * Initialize default settings if not exists
 * This runs after the database is opened
 */
export async function initializeDefaultSettings(): Promise<void> {
  try {
    const existingSettings = await db.settings.get('user-settings');

    if (!existingSettings) {
      await db.settings.add(DEFAULT_SETTINGS);
      console.info('[DB] Default settings initialized');
    }
  } catch (error) {
    console.error('[DB] Failed to initialize default settings:', error);
    throw error;
  }
}

/**
 * Future migrations will be added here as the app evolves
 * Example:
 *
 * db.version(2).stores({
 *   notes: 'id, updatedAt, isUrgent, *tags, color',
 * }).upgrade(async (trans) => {
 *   // Migrate existing data
 *   const notes = await trans.table('notes').toArray();
 *   await Promise.all(
 *     notes.map(note =>
 *       trans.table('notes').update(note.id, {
 *         color: note.color || '#E6E6FA'
 *       })
 *     )
 *   );
 * });
 */

/**
 * Open database and run initialization
 */
export async function openDatabase(): Promise<void> {
  try {
    await db.open();
    await initializeDefaultSettings();
    console.info('[DB] Database opened successfully');
  } catch (error) {
    console.error('[DB] Failed to open database:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  try {
    db.close();
    console.info('[DB] Database closed');
  } catch (error) {
    console.error('[DB] Failed to close database:', error);
  }
}

/**
 * Delete database (for testing or reset purposes)
 */
export async function deleteDatabase(): Promise<void> {
  try {
    await db.delete();
    console.info('[DB] Database deleted');
  } catch (error) {
    console.error('[DB] Failed to delete database:', error);
    throw error;
  }
}

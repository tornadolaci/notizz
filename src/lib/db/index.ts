/**
 * Database Module Index
 * Exports database instance and utilities
 */

export { db, NotizzDB } from './schema';
export {
  openDatabase,
  closeDatabase,
  deleteDatabase,
  initializeDefaultSettings,
} from './migrations';

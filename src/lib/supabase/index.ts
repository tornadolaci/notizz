/**
 * Supabase Module Index
 * Exports all Supabase related modules
 */

export { supabase, isOnline } from './client';
export type { Database, Tables, TablesInsert, TablesUpdate, Json } from './types';
export {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  getSession,
  getUser,
  resetPassword,
  updatePassword,
  onAuthStateChange,
  type AuthResult,
} from './auth.service';
export { SupabaseNotesService, SupabaseTodosService } from './data.service';
export {
  addToSyncQueue,
  processSyncQueue,
  fullSync,
  clearLocalData,
  subscribeToChanges,
  unsubscribeFromChanges,
  startPolling,
  stopPolling,
  hasPendingSyncItems,
  getPendingSyncCount,
} from './sync.service';

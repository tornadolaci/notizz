/**
 * API Module Index
 * Exports all backend API related modules (replaces the Supabase module)
 */

export {
  apiFetch,
  ApiError,
  isOnline,
  getToken,
  setToken,
  clearToken,
  registerUnauthorizedHandler,
} from './client';
export type { IUser, ISession } from './types';
export {
  signUpWithEmail,
  signInWithEmail,
  signOut,
  getSession,
  resetPassword,
  confirmPasswordReset,
  getErrorMessage,
  type AuthResult,
} from './auth.service';
export { ApiNotesService, ApiTodosService } from './data.service';
export {
  startPolling,
  stopPolling,
  initializePreviousState,
  registerLocalModification,
  registerToastCallback,
  unregisterToastCallback,
  registerSyncStatusCallback,
  unregisterSyncStatusCallback,
  getSyncStatus,
} from './sync.service';

/**
 * UUID Utility
 * Generates UUID v4 strings using crypto API
 */

/**
 * Generate a UUID v4 string
 * Uses crypto.randomUUID() if available, falls back to custom implementation
 */
export function generateUUID(): string {
  // Modern browsers support crypto.randomUUID()
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Alias for generateUUID for convenience
 */
export const generateId = generateUUID;

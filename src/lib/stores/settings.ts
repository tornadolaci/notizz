/**
 * Settings Store
 * Manages application settings with Svelte 5 runes
 */

import type { ISettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { db } from '../db';

/**
 * Settings store state
 */
let settings = $state<ISettings>(DEFAULT_SETTINGS);
let isLoading = $state(true);
let error = $state<string | null>(null);

/**
 * Initialize settings from database
 */
async function initSettings(): Promise<void> {
  try {
    isLoading = true;
    error = null;

    // Try to load settings from database
    const stored = await db.settings.get('user-settings');

    if (stored) {
      settings = stored;
    } else {
      // Initialize with default settings
      await db.settings.add(DEFAULT_SETTINGS);
      settings = DEFAULT_SETTINGS;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load settings';
    console.error('Settings initialization error:', err);
  } finally {
    isLoading = false;
  }
}

/**
 * Update settings
 */
async function updateSettings(updates: Partial<Omit<ISettings, 'id'>>): Promise<void> {
  try {
    error = null;

    const updatedSettings: ISettings = {
      ...settings,
      ...updates,
    };

    // Update in database
    await db.settings.put(updatedSettings);

    // Update local state
    settings = updatedSettings;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to update settings';
    console.error('Settings update error:', err);
    throw err;
  }
}

/**
 * Reset settings to defaults
 */
async function resetSettings(): Promise<void> {
  try {
    error = null;

    await db.settings.put(DEFAULT_SETTINGS);
    settings = DEFAULT_SETTINGS;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to reset settings';
    console.error('Settings reset error:', err);
    throw err;
  }
}

/**
 * Export settings store
 */
export const settingsStore = {
  // State
  get current() {
    return settings;
  },
  get isLoading() {
    return isLoading;
  },
  get error() {
    return error;
  },

  // Actions
  init: initSettings,
  update: updateSettings,
  reset: resetSettings,
};

/**
 * Settings Store
 * Manages application settings with Svelte stores.
 * Persisted in localStorage - settings are device-level preferences
 * (theme, font size), not user data.
 */

import { writable, derived } from 'svelte/store';
import type { ISettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { LocalStorageService } from '../services';

/**
 * Internal writable stores
 */
const settingsWritable = writable<ISettings>(DEFAULT_SETTINGS);
const isLoadingWritable = writable<boolean>(true);
const errorWritable = writable<string | null>(null);

/**
 * Initialize settings from localStorage
 */
async function initSettings(): Promise<void> {
  try {
    isLoadingWritable.set(true);
    errorWritable.set(null);

    const stored = LocalStorageService.getSettings();

    if (stored) {
      settingsWritable.set({ ...DEFAULT_SETTINGS, ...stored });
    } else {
      // Initialize with default settings
      LocalStorageService.saveSettings(DEFAULT_SETTINGS);
      settingsWritable.set(DEFAULT_SETTINGS);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load settings';
    errorWritable.set(message);
    console.error('Settings initialization error:', err);
  } finally {
    isLoadingWritable.set(false);
  }
}

/**
 * Update settings
 */
async function updateSettings(updates: Partial<Omit<ISettings, 'id'>>): Promise<void> {
  try {
    errorWritable.set(null);

    // Get current settings
    let currentSettings: ISettings = DEFAULT_SETTINGS;
    settingsWritable.subscribe((s) => (currentSettings = s))();

    const updatedSettings: ISettings = {
      ...currentSettings,
      ...updates,
    };

    LocalStorageService.saveSettings(updatedSettings);
    settingsWritable.set(updatedSettings);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update settings';
    errorWritable.set(message);
    console.error('Settings update error:', err);
    throw err;
  }
}

/**
 * Reset settings to defaults
 */
async function resetSettings(): Promise<void> {
  try {
    errorWritable.set(null);

    LocalStorageService.saveSettings(DEFAULT_SETTINGS);
    settingsWritable.set(DEFAULT_SETTINGS);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to reset settings';
    errorWritable.set(message);
    console.error('Settings reset error:', err);
    throw err;
  }
}

/**
 * Export settings store
 */
export const settingsStore = {
  // Readable stores
  subscribe: settingsWritable.subscribe,
  isLoading: { subscribe: isLoadingWritable.subscribe },
  error: { subscribe: errorWritable.subscribe },

  // Actions
  init: initSettings,
  update: updateSettings,
  reset: resetSettings,
};

/**
 * Derived store for current settings (for easier access)
 */
export const currentSettings = derived(settingsWritable, ($settings) => $settings);

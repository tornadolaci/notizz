/**
 * Settings Store
 * Manages application settings with Svelte stores
 */

import { writable, derived } from 'svelte/store';
import type { ISettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { db } from '../db';

/**
 * Internal writable stores
 */
const settingsWritable = writable<ISettings>(DEFAULT_SETTINGS);
const isLoadingWritable = writable<boolean>(true);
const errorWritable = writable<string | null>(null);

/**
 * Initialize settings from database
 */
async function initSettings(): Promise<void> {
  try {
    isLoadingWritable.set(true);
    errorWritable.set(null);

    // Try to load settings from database
    const stored = await db.settings.get('user-settings');

    if (stored) {
      settingsWritable.set(stored);
    } else {
      // Initialize with default settings
      await db.settings.add(DEFAULT_SETTINGS);
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

    // Update in database
    await db.settings.put(updatedSettings);

    // Update local state
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

    await db.settings.put(DEFAULT_SETTINGS);
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

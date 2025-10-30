/**
 * LocalStorage Service
 * Provides a wrapper for localStorage with fallback support
 * Used for quick access to settings and theme preferences
 */

import type { ISettings, Theme } from '../types';

/**
 * LocalStorage keys
 */
const STORAGE_KEYS = {
  SETTINGS: 'notizz-settings',
  THEME: 'notizz-theme',
  FONT_SIZE: 'notizz-font-size',
} as const;

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * LocalStorage Service
 */
export class LocalStorageService {
  private static available = isLocalStorageAvailable();

  /**
   * Get settings from localStorage
   */
  static getSettings(): Partial<ISettings> | null {
    if (!this.available) {
      return null;
    }

    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[LocalStorage] Failed to get settings:', error);
      return null;
    }
  }

  /**
   * Save settings to localStorage
   */
  static saveSettings(settings: Partial<ISettings>): boolean {
    if (!this.available) {
      return false;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('[LocalStorage] Failed to save settings:', error);
      return false;
    }
  }

  /**
   * Get theme preference
   */
  static getTheme(): Theme | null {
    if (!this.available) {
      return null;
    }

    try {
      const theme = localStorage.getItem(STORAGE_KEYS.THEME);
      return theme as Theme | null;
    } catch (error) {
      console.error('[LocalStorage] Failed to get theme:', error);
      return null;
    }
  }

  /**
   * Save theme preference
   */
  static saveTheme(theme: Theme): boolean {
    if (!this.available) {
      return false;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      return true;
    } catch (error) {
      console.error('[LocalStorage] Failed to save theme:', error);
      return false;
    }
  }

  /**
   * Get font size preference
   */
  static getFontSize(): string | null {
    if (!this.available) {
      return null;
    }

    try {
      return localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
    } catch (error) {
      console.error('[LocalStorage] Failed to get font size:', error);
      return null;
    }
  }

  /**
   * Save font size preference
   */
  static saveFontSize(fontSize: string): boolean {
    if (!this.available) {
      return false;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.FONT_SIZE, fontSize);
      return true;
    } catch (error) {
      console.error('[LocalStorage] Failed to save font size:', error);
      return false;
    }
  }

  /**
   * Clear all stored data
   */
  static clear(): boolean {
    if (!this.available) {
      return false;
    }

    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('[LocalStorage] Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    return this.available;
  }
}

/**
 * Export storage keys for use in other modules
 */
export { STORAGE_KEYS };

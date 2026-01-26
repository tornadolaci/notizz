/**
 * Theme Store
 * Manages theme switching (light/dark/auto) with system preference detection
 * Session-based: manual theme selection is not persisted between app restarts
 */

import { writable, get } from 'svelte/store';
import type { Theme } from '../types';
import { settingsStore } from './settings';

const SESSION_THEME_KEY = 'notizz-session-theme';

/**
 * Internal writable stores
 */
const currentThemeWritable = writable<'light' | 'dark'>('light');
const systemPreferenceWritable = writable<'light' | 'dark'>('light');

/**
 * Detect system theme preference
 */
function detectSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Get session theme (if manually set)
 */
function getSessionTheme(): 'light' | 'dark' | null {
  if (typeof sessionStorage === 'undefined') return null;

  const saved = sessionStorage.getItem(SESSION_THEME_KEY);
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  return null;
}

/**
 * Set session theme
 */
function setSessionTheme(theme: 'light' | 'dark'): void {
  if (typeof sessionStorage === 'undefined') return;

  sessionStorage.setItem(SESSION_THEME_KEY, theme);
}

/**
 * Clear session theme (return to auto mode)
 */
function clearSessionTheme(): void {
  if (typeof sessionStorage === 'undefined') return;

  sessionStorage.removeItem(SESSION_THEME_KEY);
}

/**
 * Apply theme to document
 */
function applyTheme(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;

  document.documentElement.setAttribute('data-theme', theme);
  currentThemeWritable.set(theme);
}

/**
 * Initialize theme
 * Always follows system preference on app startup
 */
function initTheme(): void {
  if (typeof window === 'undefined') return;

  // Detect system preference
  const systemPref = detectSystemTheme();
  systemPreferenceWritable.set(systemPref);

  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    const newSystemPref = e.matches ? 'dark' : 'light';
    systemPreferenceWritable.set(newSystemPref);

    // If no session override, apply the new system preference
    if (!getSessionTheme()) {
      applyTheme(newSystemPref);
    }
  });

  // Clear any previous session theme to ensure fresh start with system preference
  clearSessionTheme();

  // Apply system theme on app startup
  applyTheme(systemPref);
}

/**
 * Set theme (updates settings store for backward compatibility)
 */
async function setTheme(theme: Theme): Promise<void> {
  await settingsStore.update({ theme });

  if (theme === 'auto') {
    clearSessionTheme();
    const systemPref = get(systemPreferenceWritable);
    applyTheme(systemPref);
  } else {
    setSessionTheme(theme);
    applyTheme(theme);
  }
}

/**
 * Toggle theme (light <-> dark)
 * This creates a session override and does not persist between app restarts
 */
async function toggleTheme(): Promise<void> {
  const current = get(currentThemeWritable);
  const newTheme = current === 'light' ? 'dark' : 'light';

  // Set session theme without persisting to settings
  setSessionTheme(newTheme);
  applyTheme(newTheme);
}

/**
 * Export theme store
 */
export const themeStore = {
  // Readable stores
  current: { subscribe: currentThemeWritable.subscribe },
  system: { subscribe: systemPreferenceWritable.subscribe },

  // Actions
  init: initTheme,
  set: setTheme,
  toggle: toggleTheme,
};

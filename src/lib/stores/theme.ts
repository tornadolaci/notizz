/**
 * Theme Store
 * Manages theme switching (light/dark/auto) with system preference detection
 */

import { writable, get } from 'svelte/store';
import type { Theme } from '../types';
import { settingsStore } from './settings';

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
 * Apply theme to document
 */
function applyTheme(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;

  document.documentElement.setAttribute('data-theme', theme);
  currentThemeWritable.set(theme);
}

/**
 * Resolve theme based on settings
 */
function resolveTheme(themeSetting: Theme, systemPref: 'light' | 'dark'): 'light' | 'dark' {
  if (themeSetting === 'auto') {
    return systemPref;
  }
  return themeSetting;
}

/**
 * Initialize theme
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

    // If theme is auto, apply the new system preference
    settingsStore.subscribe((settings) => {
      if (settings.theme === 'auto') {
        applyTheme(newSystemPref);
      }
    })();
  });

  // Apply initial theme
  settingsStore.subscribe((settings) => {
    const theme = resolveTheme(settings.theme, systemPref);
    applyTheme(theme);
  })();
}

/**
 * Set theme
 */
async function setTheme(theme: Theme): Promise<void> {
  await settingsStore.update({ theme });
  const systemPref = get(systemPreferenceWritable);
  const resolvedTheme = resolveTheme(theme, systemPref);
  applyTheme(resolvedTheme);
}

/**
 * Toggle theme (light <-> dark)
 */
async function toggleTheme(): Promise<void> {
  const current = get(currentThemeWritable);
  const newTheme = current === 'light' ? 'dark' : 'light';
  await setTheme(newTheme);
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

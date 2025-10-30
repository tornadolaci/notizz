/**
 * Theme Store
 * Manages theme switching (light/dark/auto) with system preference detection
 */

import type { Theme } from '../types';
import { settingsStore } from './settings';

/**
 * Theme store state
 */
let currentTheme = $state<'light' | 'dark'>('light');
let systemPreference = $state<'light' | 'dark'>('light');

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
  currentTheme = theme;
}

/**
 * Resolve theme based on settings
 */
function resolveTheme(themeSetting: Theme): 'light' | 'dark' {
  if (themeSetting === 'auto') {
    return systemPreference;
  }
  return themeSetting;
}

/**
 * Initialize theme
 */
function initTheme(): void {
  if (typeof window === 'undefined') return;

  // Detect system preference
  systemPreference = detectSystemTheme();

  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    systemPreference = e.matches ? 'dark' : 'light';

    // If theme is auto, apply the new system preference
    if (settingsStore.current.theme === 'auto') {
      applyTheme(systemPreference);
    }
  });

  // Apply initial theme
  const theme = resolveTheme(settingsStore.current.theme);
  applyTheme(theme);
}

/**
 * Set theme
 */
async function setTheme(theme: Theme): Promise<void> {
  await settingsStore.update({ theme });
  const resolvedTheme = resolveTheme(theme);
  applyTheme(resolvedTheme);
}

/**
 * Toggle theme (light <-> dark)
 */
async function toggleTheme(): Promise<void> {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  await setTheme(newTheme);
}

/**
 * Derived: Get effective theme
 */
const effectiveTheme = $derived(resolveTheme(settingsStore.current.theme));

/**
 * Export theme store
 */
export const themeStore = {
  // State
  get current() {
    return currentTheme;
  },
  get system() {
    return systemPreference;
  },
  get effective() {
    return effectiveTheme;
  },
  get setting() {
    return settingsStore.current.theme;
  },

  // Actions
  init: initTheme,
  set: setTheme,
  toggle: toggleTheme,
};

/**
 * Settings Type Definitions
 * Defines the TypeScript interfaces for application settings
 */

/**
 * Theme options
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * Font size options
 */
export type FontSize = 'small' | 'medium' | 'large';

/**
 * Language options (currently only Hungarian)
 */
export type Language = 'hu';

/**
 * Sort order options
 */
export type SortOrder = 'updated' | 'created' | 'alphabetical';

/**
 * Settings interface - represents user preferences
 */
export interface ISettings {
  id: 'user-settings'; // Fixed ID for singleton pattern
  theme: Theme;
  fontSize: FontSize;
  language: Language;
  enableAnimations: boolean;
  enableSound: boolean;
  defaultColor: string; // Default color for new notes/todos
  sortOrder: SortOrder;
}

/**
 * Settings update input - used when updating settings
 * All fields are optional except id
 */
export type SettingsUpdateInput = Partial<Omit<ISettings, 'id'>> & {
  id: 'user-settings';
};

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: ISettings = {
  id: 'user-settings',
  theme: 'auto',
  fontSize: 'large',
  language: 'hu',
  enableAnimations: true,
  enableSound: false,
  defaultColor: '#E6E6FA', // Lavender
  sortOrder: 'updated',
};

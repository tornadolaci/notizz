/**
 * Settings Validation Schemas
 * Zod schemas for validating settings data
 */

import { z } from 'zod';

/**
 * Theme options
 */
const ThemeEnum = z.enum(['light', 'dark', 'auto']);

/**
 * Font size options
 */
const FontSizeEnum = z.enum(['small', 'medium', 'large']);

/**
 * Language options
 */
const LanguageEnum = z.enum(['hu']);

/**
 * Sort order options
 */
const SortOrderEnum = z.enum(['updated', 'created', 'alphabetical']);

/**
 * Pastel color palette validation
 */
const PASTEL_COLORS = [
  '#E6E6FA', // Lavender
  '#FFDAB9', // Peach
  '#B2DFDB', // Mint
  '#87CEEB', // Sky
  '#FFB6C1', // Rose
  '#FFFACD', // Lemon
  '#B2D3C2', // Sage
  '#FFB5A7', // Coral
] as const;

/**
 * Settings schema - validates complete settings object
 */
export const SettingsSchema = z.object({
  id: z.literal('user-settings'),
  theme: ThemeEnum,
  fontSize: FontSizeEnum,
  language: LanguageEnum,
  enableAnimations: z.boolean(),
  enableSound: z.boolean(),
  defaultColor: z
    .string()
    .refine((val) => PASTEL_COLORS.includes(val as any), {
      message: 'Érvénytelen alapértelmezett szín',
    }),
  sortOrder: SortOrderEnum,
});

/**
 * Settings update schema - validates partial settings updates
 */
export const SettingsUpdateSchema = z.object({
  id: z.literal('user-settings'),
  theme: ThemeEnum.optional(),
  fontSize: FontSizeEnum.optional(),
  language: LanguageEnum.optional(),
  enableAnimations: z.boolean().optional(),
  enableSound: z.boolean().optional(),
  defaultColor: z
    .string()
    .refine((val) => PASTEL_COLORS.includes(val as any), {
      message: 'Érvénytelen alapértelmezett szín',
    })
    .optional(),
  sortOrder: SortOrderEnum.optional(),
});

/**
 * Export enums for use in components
 */
export { ThemeEnum, FontSizeEnum, LanguageEnum, SortOrderEnum, PASTEL_COLORS };

/**
 * Type exports inferred from schemas
 */
export type Settings = z.infer<typeof SettingsSchema>;
export type SettingsUpdate = z.infer<typeof SettingsUpdateSchema>;
export type Theme = z.infer<typeof ThemeEnum>;
export type FontSize = z.infer<typeof FontSizeEnum>;
export type Language = z.infer<typeof LanguageEnum>;
export type SortOrder = z.infer<typeof SortOrderEnum>;

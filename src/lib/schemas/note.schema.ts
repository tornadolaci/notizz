/**
 * Note Validation Schemas
 * Zod schemas for validating note data
 */

import { z } from 'zod';
import { PASTEL_COLORS } from '../constants/colors';

/**
 * Pastel color palette validation - uses centralized color definitions
 */
const PASTEL_COLOR_VALUES = Object.values(PASTEL_COLORS) as readonly string[];

/**
 * Note schema - validates a complete note object
 */
export const NoteSchema = z.object({
  id: z.string().uuid().optional(),
  title: z
    .string()
    .min(1, 'A cím nem lehet üres')
    .max(200, 'A cím maximum 200 karakter lehet'),
  content: z
    .string()
    .min(0)
    .max(10000, 'A tartalom maximum 10000 karakter lehet'),
  color: z
    .string()
    .refine((val) => PASTEL_COLOR_VALUES.includes(val), {
      message: 'Érvénytelen szín',
    }),
  createdAt: z.date(),
  updatedAt: z.date(),
  order: z.number(),
});

/**
 * Note creation schema - validates input for creating a new note
 */
export const NoteCreateSchema = z.object({
  title: z
    .string()
    .min(1, 'A cím nem lehet üres')
    .max(200, 'A cím maximum 200 karakter lehet'),
  content: z
    .string()
    .min(0)
    .max(10000, 'A tartalom maximum 10000 karakter lehet'),
  color: z
    .string()
    .refine((val) => PASTEL_COLOR_VALUES.includes(val), {
      message: 'Érvénytelen szín',
    }),
});

/**
 * Note update schema - validates input for updating an existing note
 */
export const NoteUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z
    .string()
    .min(1, 'A cím nem lehet üres')
    .max(200, 'A cím maximum 200 karakter lehet')
    .optional(),
  content: z
    .string()
    .min(0)
    .max(10000, 'A tartalom maximum 10000 karakter lehet')
    .optional(),
  color: z
    .string()
    .refine((val) => PASTEL_COLOR_VALUES.includes(val), {
      message: 'Érvénytelen szín',
    })
    .optional(),
  updatedAt: z.date().optional(),
  order: z.number().optional(),
});

/**
 * Export pastel colors for use in components
 * Re-exported from centralized color definitions
 */
export { PASTEL_COLORS } from '../constants/colors';
export { PASTEL_COLOR_VALUES };

/**
 * Type exports inferred from schemas
 */
export type Note = z.infer<typeof NoteSchema>;
export type NoteCreate = z.infer<typeof NoteCreateSchema>;
export type NoteUpdate = z.infer<typeof NoteUpdateSchema>;

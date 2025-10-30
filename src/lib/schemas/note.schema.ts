/**
 * Note Validation Schemas
 * Zod schemas for validating note data
 */

import { z } from 'zod';

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
    .refine((val) => PASTEL_COLORS.includes(val as any), {
      message: 'Érvénytelen szín',
    }),
  tags: z.array(z.string().min(1).max(50)).max(10, 'Maximum 10 címke engedélyezett'),
  createdAt: z.date(),
  updatedAt: z.date(),
  isUrgent: z.boolean(),
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
    .refine((val) => PASTEL_COLORS.includes(val as any), {
      message: 'Érvénytelen szín',
    }),
  tags: z.array(z.string().min(1).max(50)).max(10, 'Maximum 10 címke engedélyezett'),
  isUrgent: z.boolean(),
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
    .refine((val) => PASTEL_COLORS.includes(val as any), {
      message: 'Érvénytelen szín',
    })
    .optional(),
  tags: z
    .array(z.string().min(1).max(50))
    .max(10, 'Maximum 10 címke engedélyezett')
    .optional(),
  isUrgent: z.boolean().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Export pastel colors for use in components
 */
export { PASTEL_COLORS };

/**
 * Type exports inferred from schemas
 */
export type Note = z.infer<typeof NoteSchema>;
export type NoteCreate = z.infer<typeof NoteCreateSchema>;
export type NoteUpdate = z.infer<typeof NoteUpdateSchema>;

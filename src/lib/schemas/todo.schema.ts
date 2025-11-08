/**
 * Todo Validation Schemas
 * Zod schemas for validating todo data
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
 * TodoItem schema - validates a single todo item
 */
export const TodoItemSchema = z.object({
  id: z.string().uuid(),
  text: z
    .string()
    .min(1, 'A feladat szövege nem lehet üres')
    .max(500, 'A feladat szövege maximum 500 karakter lehet'),
  completed: z.boolean(),
  createdAt: z.date(),
});

/**
 * Todo schema - validates a complete todo list object
 */
export const TodoSchema = z.object({
  id: z.string().uuid().optional(),
  title: z
    .string()
    .min(1, 'A cím nem lehet üres')
    .max(200, 'A cím maximum 200 karakter lehet'),
  items: z.array(TodoItemSchema).max(100, 'Maximum 100 feladat engedélyezett listánként'),
  color: z
    .string()
    .refine((val) => PASTEL_COLORS.includes(val as any), {
      message: 'Érvénytelen szín',
    }),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedCount: z.number().int().min(0),
  totalCount: z.number().int().min(0),
  order: z.number(),
});

/**
 * Todo creation schema - validates input for creating a new todo
 */
export const TodoCreateSchema = z.object({
  title: z
    .string()
    .min(1, 'A cím nem lehet üres')
    .max(200, 'A cím maximum 200 karakter lehet'),
  items: z.array(TodoItemSchema).max(100, 'Maximum 100 feladat engedélyezett listánként'),
  color: z
    .string()
    .refine((val) => PASTEL_COLORS.includes(val as any), {
      message: 'Érvénytelen szín',
    }),
});

/**
 * Todo update schema - validates input for updating an existing todo
 */
export const TodoUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z
    .string()
    .min(1, 'A cím nem lehet üres')
    .max(200, 'A cím maximum 200 karakter lehet')
    .optional(),
  items: z
    .array(TodoItemSchema)
    .max(100, 'Maximum 100 feladat engedélyezett listánként')
    .optional(),
  color: z
    .string()
    .refine((val) => PASTEL_COLORS.includes(val as any), {
      message: 'Érvénytelen szín',
    })
    .optional(),
  updatedAt: z.date().optional(),
  completedCount: z.number().int().min(0).optional(),
  totalCount: z.number().int().min(0).optional(),
  order: z.number().optional(),
});

/**
 * TodoItem creation schema - validates input for creating a new todo item
 */
export const TodoItemCreateSchema = z.object({
  text: z
    .string()
    .min(1, 'A feladat szövege nem lehet üres')
    .max(500, 'A feladat szövege maximum 500 karakter lehet'),
  completed: z.boolean().default(false),
});

/**
 * Export pastel colors for use in components
 */
export { PASTEL_COLORS };

/**
 * Type exports inferred from schemas
 */
export type Todo = z.infer<typeof TodoSchema>;
export type TodoItem = z.infer<typeof TodoItemSchema>;
export type TodoCreate = z.infer<typeof TodoCreateSchema>;
export type TodoUpdate = z.infer<typeof TodoUpdateSchema>;
export type TodoItemCreate = z.infer<typeof TodoItemCreateSchema>;

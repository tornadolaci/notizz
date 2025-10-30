/**
 * Validation Schemas Index
 * Exports all Zod schemas from a single entry point
 */

export {
  NoteSchema,
  NoteCreateSchema,
  NoteUpdateSchema,
  PASTEL_COLORS as NOTE_COLORS,
} from './note.schema';

export type { Note, NoteCreate, NoteUpdate } from './note.schema';

export {
  TodoSchema,
  TodoItemSchema,
  TodoCreateSchema,
  TodoUpdateSchema,
  TodoItemCreateSchema,
  PASTEL_COLORS as TODO_COLORS,
} from './todo.schema';

export type {
  Todo,
  TodoItem,
  TodoCreate,
  TodoUpdate,
  TodoItemCreate,
} from './todo.schema';

export {
  SettingsSchema,
  SettingsUpdateSchema,
  ThemeEnum,
  FontSizeEnum,
  LanguageEnum,
  SortOrderEnum,
  PASTEL_COLORS as SETTINGS_COLORS,
} from './settings.schema';

export type {
  Settings,
  SettingsUpdate,
  Theme,
  FontSize,
  Language,
  SortOrder,
} from './settings.schema';

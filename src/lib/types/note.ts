/**
 * Note Type Definitions
 * Defines the TypeScript interfaces for Note entities
 */

/**
 * Note interface - represents a single note in the database
 */
export interface INote {
  id?: string; // UUID, optional for new notes (auto-generated)
  title: string;
  content: string;
  color: string; // One of the 8 pastel colors
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isUrgent: boolean;
  order: number; // Custom sort order for drag&drop
}

/**
 * Note creation input - used when creating a new note
 * Omits auto-generated fields
 */
export type NoteCreateInput = Omit<INote, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Note update input - used when updating an existing note
 * All fields are optional except id
 */
export type NoteUpdateInput = Partial<Omit<INote, 'id' | 'createdAt'>> & {
  id: string;
};

/**
 * Note filter options for querying notes
 */
export interface INoteFilter {
  tags?: string[];
  isUrgent?: boolean;
  color?: string;
  searchTerm?: string;
}

/**
 * Note sort order options
 */
export type NoteSortOrder = 'updated' | 'created' | 'alphabetical';

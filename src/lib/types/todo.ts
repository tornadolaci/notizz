/**
 * Todo Type Definitions
 * Defines the TypeScript interfaces for Todo entities
 */

/**
 * TodoItem interface - represents a single item within a todo list
 */
export interface ITodoItem {
  id: string; // UUID
  text: string;
  completed: boolean;
  createdAt: Date;
}

/**
 * Todo interface - represents a todo list in the database
 */
export interface ITodo {
  id?: string; // UUID, optional for new todos (auto-generated)
  title: string;
  items: ITodoItem[];
  color: string; // One of the 8 pastel colors
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isUrgent: boolean;
  completedCount: number; // Derived from items
  totalCount: number; // Derived from items
}

/**
 * Todo creation input - used when creating a new todo
 * Omits auto-generated fields
 */
export type TodoCreateInput = Omit<
  ITodo,
  'id' | 'createdAt' | 'updatedAt' | 'completedCount' | 'totalCount'
>;

/**
 * Todo update input - used when updating an existing todo
 * All fields are optional except id
 */
export type TodoUpdateInput = Partial<
  Omit<ITodo, 'id' | 'createdAt' | 'completedCount' | 'totalCount'>
> & {
  id: string;
};

/**
 * TodoItem creation input - used when adding a new item to a todo
 */
export type TodoItemCreateInput = Omit<ITodoItem, 'id' | 'createdAt'>;

/**
 * Todo filter options for querying todos
 */
export interface ITodoFilter {
  tags?: string[];
  isUrgent?: boolean;
  color?: string;
  searchTerm?: string;
  completed?: boolean; // Filter by completion status
}

/**
 * Todo sort order options
 */
export type TodoSortOrder = 'updated' | 'created' | 'alphabetical' | 'completion';

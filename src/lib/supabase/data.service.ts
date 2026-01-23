/**
 * Supabase Data Service
 * Handles CRUD operations for notes and todos with Supabase
 */

import { supabase, isOnline } from './client';
import type { INote, ITodo, ITodoItem } from '../types';
import type { Database } from './types';

type NoteRow = Database['public']['Tables']['notes']['Row'];
type TodoRow = Database['public']['Tables']['todos']['Row'];

/**
 * Convert Supabase note row to INote
 */
function toINote(row: NoteRow): INote {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    color: row.color,
    order: row.order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Convert INote to Supabase insert format
 */
function fromINote(note: INote, userId: string): Database['public']['Tables']['notes']['Insert'] {
  return {
    id: note.id,
    user_id: userId,
    title: note.title,
    content: note.content,
    color: note.color,
    order: note.order,
    created_at: note.createdAt.toISOString(),
    updated_at: note.updatedAt.toISOString(),
  };
}

/**
 * Convert Supabase todo row to ITodo
 */
function toITodo(row: TodoRow): ITodo {
  const rawItems = (row.items as unknown as Array<{ id: string; text: string; completed: boolean; createdAt: string | Date }>) || [];
  // Convert createdAt strings to Date objects for each item
  const items: ITodoItem[] = rawItems.map(item => ({
    ...item,
    createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt),
  }));
  return {
    id: row.id,
    title: row.title,
    items,
    color: row.color,
    order: row.order,
    completedCount: row.completed_count,
    totalCount: row.total_count,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Convert ITodo to Supabase insert format
 */
function fromITodo(todo: ITodo, userId: string): Database['public']['Tables']['todos']['Insert'] {
  return {
    id: todo.id,
    user_id: userId,
    title: todo.title,
    items: todo.items as unknown as Database['public']['Tables']['todos']['Insert']['items'],
    color: todo.color,
    order: todo.order,
    completed_count: todo.completedCount,
    total_count: todo.totalCount,
    created_at: todo.createdAt.toISOString(),
    updated_at: todo.updatedAt.toISOString(),
  };
}

/**
 * Notes operations
 */
export const SupabaseNotesService = {
  async getAll(userId: string): Promise<INote[]> {
    if (!isOnline()) return [];

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }

    return (data || []).map(toINote);
  },

  async getById(id: string, userId: string): Promise<INote | null> {
    if (!isOnline()) return null;

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching note:', error);
      throw error;
    }

    return data ? toINote(data) : null;
  },

  async create(note: INote, userId: string): Promise<INote> {
    if (!isOnline()) throw new Error('Offline');

    const { data, error } = await supabase
      .from('notes')
      .insert(fromINote(note, userId))
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      throw error;
    }

    return toINote(data);
  },

  async update(id: string, updates: Partial<INote>, userId: string): Promise<INote> {
    if (!isOnline()) throw new Error('Offline');

    const updateData: Database['public']['Tables']['notes']['Update'] = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.order !== undefined) updateData.order = updates.order;
    if (updates.updatedAt !== undefined) updateData.updated_at = updates.updatedAt.toISOString();

    const { data, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating note:', error);
      throw error;
    }

    return toINote(data);
  },

  async delete(id: string, userId: string): Promise<void> {
    if (!isOnline()) throw new Error('Offline');

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  },

  async upsert(note: INote, userId: string): Promise<INote> {
    if (!isOnline()) throw new Error('Offline');

    const { data, error } = await supabase
      .from('notes')
      .upsert(fromINote(note, userId), { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting note:', error);
      throw error;
    }

    return toINote(data);
  },
};

/**
 * Todos operations
 */
export const SupabaseTodosService = {
  async getAll(userId: string): Promise<ITodo[]> {
    if (!isOnline()) return [];

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching todos:', error);
      throw error;
    }

    return (data || []).map(toITodo);
  },

  async getById(id: string, userId: string): Promise<ITodo | null> {
    if (!isOnline()) return null;

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching todo:', error);
      throw error;
    }

    return data ? toITodo(data) : null;
  },

  async create(todo: ITodo, userId: string): Promise<ITodo> {
    if (!isOnline()) throw new Error('Offline');

    const { data, error } = await supabase
      .from('todos')
      .insert(fromITodo(todo, userId))
      .select()
      .single();

    if (error) {
      console.error('Error creating todo:', error);
      throw error;
    }

    return toITodo(data);
  },

  async update(id: string, updates: Partial<ITodo>, userId: string): Promise<ITodo> {
    if (!isOnline()) throw new Error('Offline');

    const updateData: Database['public']['Tables']['todos']['Update'] = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.items !== undefined) {
      updateData.items = updates.items as unknown as Database['public']['Tables']['todos']['Update']['items'];
    }
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.order !== undefined) updateData.order = updates.order;
    if (updates.completedCount !== undefined) updateData.completed_count = updates.completedCount;
    if (updates.totalCount !== undefined) updateData.total_count = updates.totalCount;
    if (updates.updatedAt !== undefined) updateData.updated_at = updates.updatedAt.toISOString();

    const { data, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating todo:', error);
      throw error;
    }

    return toITodo(data);
  },

  async delete(id: string, userId: string): Promise<void> {
    if (!isOnline()) throw new Error('Offline');

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting todo:', error);
      throw error;
    }
  },

  async upsert(todo: ITodo, userId: string): Promise<ITodo> {
    if (!isOnline()) throw new Error('Offline');

    const { data, error } = await supabase
      .from('todos')
      .upsert(fromITodo(todo, userId), { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting todo:', error);
      throw error;
    }

    return toITodo(data);
  },
};

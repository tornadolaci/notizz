/**
 * API Data Service
 * CRUD operations for notes and todos against the PHP backend.
 * Same interface as the previous Supabase data service, but the user is
 * derived from the Bearer token - no userId parameter needed.
 */

import { apiFetch, isOnline } from './client';
import type { INote, ITodo, ITodoItem } from '../types';

interface NoteDto {
  id: string;
  title: string;
  content: string;
  color: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface TodoItemDto {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string | Date;
}

interface TodoDto {
  id: string;
  title: string;
  items: TodoItemDto[];
  color: string;
  order: number;
  completedCount: number;
  totalCount: number;
  createdAt: string;
  updatedAt: string;
}

function toISO(date: Date | string): string {
  return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
}

function toINote(dto: NoteDto): INote {
  return {
    id: dto.id,
    title: dto.title,
    content: dto.content,
    color: dto.color,
    order: dto.order,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}

function fromINote(note: INote): NoteDto {
  return {
    id: note.id!,
    title: note.title,
    content: note.content,
    color: note.color,
    order: note.order,
    createdAt: toISO(note.createdAt),
    updatedAt: toISO(note.updatedAt),
  };
}

function toITodo(dto: TodoDto): ITodo {
  // Convert item createdAt strings to Date objects (JSON transport)
  const items: ITodoItem[] = (dto.items || []).map((item) => ({
    ...item,
    createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt),
  }));
  return {
    id: dto.id,
    title: dto.title,
    items,
    color: dto.color,
    order: dto.order,
    completedCount: dto.completedCount,
    totalCount: dto.totalCount,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}

function itemsToDto(items: ITodoItem[]): TodoItemDto[] {
  return items.map((item) => ({
    id: item.id,
    text: item.text,
    completed: item.completed,
    createdAt: toISO(item.createdAt),
  }));
}

function fromITodo(todo: ITodo): TodoDto {
  return {
    id: todo.id!,
    title: todo.title,
    items: itemsToDto(todo.items),
    color: todo.color,
    order: todo.order,
    completedCount: todo.completedCount,
    totalCount: todo.totalCount,
    createdAt: toISO(todo.createdAt),
    updatedAt: toISO(todo.updatedAt),
  };
}

/**
 * Notes operations
 */
export const ApiNotesService = {
  async getAll(): Promise<INote[]> {
    if (!isOnline()) return [];
    const data = await apiFetch<NoteDto[]>('notes');
    return data.map(toINote);
  },

  async create(note: INote): Promise<INote> {
    if (!isOnline()) throw new Error('Offline');
    const data = await apiFetch<NoteDto>('notes', { method: 'POST', body: fromINote(note) });
    return toINote(data);
  },

  async update(id: string, updates: Partial<INote>): Promise<INote> {
    if (!isOnline()) throw new Error('Offline');

    const body: Record<string, unknown> = {};
    if (updates.title !== undefined) body.title = updates.title;
    if (updates.content !== undefined) body.content = updates.content;
    if (updates.color !== undefined) body.color = updates.color;
    if (updates.order !== undefined) body.order = updates.order;
    // CRITICAL: updatedAt is only sent when the caller provides it -
    // order-only changes must not touch the stored updated_at
    if (updates.updatedAt !== undefined) body.updatedAt = toISO(updates.updatedAt);

    const data = await apiFetch<NoteDto>(`notes/${id}`, { method: 'PATCH', body });
    return toINote(data);
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) throw new Error('Offline');
    await apiFetch(`notes/${id}`, { method: 'DELETE' });
  },

  async upsert(note: INote): Promise<INote> {
    if (!isOnline()) throw new Error('Offline');
    const data = await apiFetch<NoteDto>(`notes/${note.id}`, { method: 'PUT', body: fromINote(note) });
    return toINote(data);
  },
};

/**
 * Todos operations
 */
export const ApiTodosService = {
  async getAll(): Promise<ITodo[]> {
    if (!isOnline()) return [];
    const data = await apiFetch<TodoDto[]>('todos');
    return data.map(toITodo);
  },

  async create(todo: ITodo): Promise<ITodo> {
    if (!isOnline()) throw new Error('Offline');
    const data = await apiFetch<TodoDto>('todos', { method: 'POST', body: fromITodo(todo) });
    return toITodo(data);
  },

  async update(id: string, updates: Partial<ITodo>): Promise<ITodo> {
    if (!isOnline()) throw new Error('Offline');

    const body: Record<string, unknown> = {};
    if (updates.title !== undefined) body.title = updates.title;
    if (updates.items !== undefined) body.items = itemsToDto(updates.items);
    if (updates.color !== undefined) body.color = updates.color;
    if (updates.order !== undefined) body.order = updates.order;
    if (updates.completedCount !== undefined) body.completedCount = updates.completedCount;
    if (updates.totalCount !== undefined) body.totalCount = updates.totalCount;
    // CRITICAL: updatedAt is only sent when the caller provides it
    if (updates.updatedAt !== undefined) body.updatedAt = toISO(updates.updatedAt);

    const data = await apiFetch<TodoDto>(`todos/${id}`, { method: 'PATCH', body });
    return toITodo(data);
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) throw new Error('Offline');
    await apiFetch(`todos/${id}`, { method: 'DELETE' });
  },

  async upsert(todo: ITodo): Promise<ITodo> {
    if (!isOnline()) throw new Error('Offline');
    const data = await apiFetch<TodoDto>(`todos/${todo.id}`, { method: 'PUT', body: fromITodo(todo) });
    return toITodo(data);
  },
};

/**
 * Storage Service Tests
 * Unit tests for NotesService, TodosService, and SettingsService
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NotesService, TodosService, SettingsService } from '../../../src/lib/services';
import { db, openDatabase, deleteDatabase } from '../../../src/lib/db';
import type { NoteCreateInput, TodoCreateInput } from '../../../src/lib/types';

describe('NotesService', () => {
  beforeEach(async () => {
    await openDatabase();
  });

  afterEach(async () => {
    await deleteDatabase();
  });

  it('should create a note', async () => {
    const input: NoteCreateInput = {
      title: 'Test Note',
      content: 'This is a test note',
      color: '#E6E6FA',
      tags: ['test'],
      isUrgent: false,
    };

    const note = await NotesService.create(input);

    expect(note).toBeDefined();
    expect(note.id).toBeDefined();
    expect(note.title).toBe(input.title);
    expect(note.content).toBe(input.content);
    expect(note.createdAt).toBeInstanceOf(Date);
    expect(note.updatedAt).toBeInstanceOf(Date);
  });

  it('should get all notes', async () => {
    const input: NoteCreateInput = {
      title: 'Test Note',
      content: 'Content',
      color: '#E6E6FA',
      tags: [],
      isUrgent: false,
    };

    await NotesService.create(input);
    await NotesService.create({ ...input, title: 'Test Note 2' });

    const notes = await NotesService.getAll();

    expect(notes).toHaveLength(2);
  });

  it('should update a note', async () => {
    const input: NoteCreateInput = {
      title: 'Original Title',
      content: 'Content',
      color: '#E6E6FA',
      tags: [],
      isUrgent: false,
    };

    const note = await NotesService.create(input);
    const updated = await NotesService.update({
      id: note.id!,
      title: 'Updated Title',
    });

    expect(updated?.title).toBe('Updated Title');
  });

  it('should delete a note', async () => {
    const input: NoteCreateInput = {
      title: 'Test Note',
      content: 'Content',
      color: '#E6E6FA',
      tags: [],
      isUrgent: false,
    };

    const note = await NotesService.create(input);
    await NotesService.delete(note.id!);

    const retrieved = await NotesService.getById(note.id!);
    expect(retrieved).toBeUndefined();
  });

  it('should filter urgent notes', async () => {
    const urgentInput: NoteCreateInput = {
      title: 'Urgent Note',
      content: 'Content',
      color: '#E6E6FA',
      tags: [],
      isUrgent: true,
    };

    const normalInput: NoteCreateInput = {
      title: 'Normal Note',
      content: 'Content',
      color: '#E6E6FA',
      tags: [],
      isUrgent: false,
    };

    await NotesService.create(urgentInput);
    await NotesService.create(normalInput);

    const urgentNotes = await NotesService.getUrgent();

    expect(urgentNotes).toHaveLength(1);
    expect(urgentNotes[0].isUrgent).toBe(true);
  });
});

describe('TodosService', () => {
  beforeEach(async () => {
    await openDatabase();
  });

  afterEach(async () => {
    await deleteDatabase();
  });

  it('should create a todo', async () => {
    const input: TodoCreateInput = {
      title: 'Test Todo',
      items: [
        {
          id: 'item-1',
          text: 'Task 1',
          completed: false,
          createdAt: new Date(),
        },
      ],
      color: '#E6E6FA',
      tags: ['test'],
      isUrgent: false,
    };

    const todo = await TodosService.create(input);

    expect(todo).toBeDefined();
    expect(todo.id).toBeDefined();
    expect(todo.title).toBe(input.title);
    expect(todo.items).toHaveLength(1);
    expect(todo.totalCount).toBe(1);
    expect(todo.completedCount).toBe(0);
  });

  it('should calculate counts correctly', async () => {
    const input: TodoCreateInput = {
      title: 'Test Todo',
      items: [
        {
          id: 'item-1',
          text: 'Task 1',
          completed: true,
          createdAt: new Date(),
        },
        {
          id: 'item-2',
          text: 'Task 2',
          completed: false,
          createdAt: new Date(),
        },
      ],
      color: '#E6E6FA',
      tags: [],
      isUrgent: false,
    };

    const todo = await TodosService.create(input);

    expect(todo.totalCount).toBe(2);
    expect(todo.completedCount).toBe(1);
  });

  it('should toggle todo item', async () => {
    const input: TodoCreateInput = {
      title: 'Test Todo',
      items: [
        {
          id: 'item-1',
          text: 'Task 1',
          completed: false,
          createdAt: new Date(),
        },
      ],
      color: '#E6E6FA',
      tags: [],
      isUrgent: false,
    };

    const todo = await TodosService.create(input);
    const updated = await TodosService.toggleItem(todo.id!, 'item-1');

    expect(updated?.items[0].completed).toBe(true);
    expect(updated?.completedCount).toBe(1);
  });

  it('should delete a todo', async () => {
    const input: TodoCreateInput = {
      title: 'Test Todo',
      items: [],
      color: '#E6E6FA',
      tags: [],
      isUrgent: false,
    };

    const todo = await TodosService.create(input);
    await TodosService.delete(todo.id!);

    const retrieved = await TodosService.getById(todo.id!);
    expect(retrieved).toBeUndefined();
  });
});

describe('SettingsService', () => {
  beforeEach(async () => {
    await openDatabase();
  });

  afterEach(async () => {
    await deleteDatabase();
  });

  it('should get settings', async () => {
    const settings = await SettingsService.get();

    expect(settings).toBeDefined();
    expect(settings?.id).toBe('user-settings');
  });

  it('should update settings', async () => {
    await SettingsService.update({
      theme: 'dark',
      fontSize: 'large',
    });

    const settings = await SettingsService.get();

    expect(settings?.theme).toBe('dark');
    expect(settings?.fontSize).toBe('large');
  });

  it('should reset settings to default', async () => {
    await SettingsService.update({
      theme: 'dark',
    });

    const resetSettings = await SettingsService.reset();

    expect(resetSettings.theme).toBe('auto');
    expect(resetSettings.fontSize).toBe('medium');
  });
});

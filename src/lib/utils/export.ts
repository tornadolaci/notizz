/**
 * Export/Import Utilities
 * Handles data export and import functionality
 */

import { db } from '../db';
import type { INote, ITodo, ISettings } from '../types';
import { z } from 'zod';
import { NoteSchema } from '../schemas/note.schema';
import { TodoSchema } from '../schemas/todo.schema';
import { SettingsSchema } from '../schemas/settings.schema';

/**
 * Export data interface
 */
export interface ExportData {
  version: string;
  exportedAt: string;
  notes: INote[];
  todos: ITodo[];
  settings: ISettings;
}

/**
 * Zod schema for import validation
 */
const exportDataSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  notes: z.array(NoteSchema),
  todos: z.array(TodoSchema),
  settings: SettingsSchema,
});

/**
 * Export all data to JSON
 */
export async function exportData(): Promise<ExportData> {
  try {
    const notes = await db.notes.toArray();
    const todos = await db.todos.toArray();
    const settings = await db.settings.get('user-settings');

    const exportData: ExportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      notes,
      todos,
      settings: settings || {
        id: 'user-settings',
        theme: 'auto',
        fontSize: 'medium',
        language: 'hu',
        enableAnimations: true,
        enableSound: false,
        defaultColor: '#E6E6FA',
        sortOrder: 'updated',
      },
    };

    return exportData;
  } catch (error) {
    console.error('Export error:', error);
    throw new Error('Az adatok exportálása sikertelen');
  }
}

/**
 * Download JSON data as file
 */
export function downloadJSON(data: ExportData, filename?: string): void {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `notizz-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    throw new Error('A fájl letöltése sikertelen');
  }
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  message: string;
  notesImported: number;
  todosImported: number;
  conflicts: number;
}

/**
 * Validate and parse import data
 */
export function validateImportData(jsonString: string): ExportData {
  try {
    const parsed = JSON.parse(jsonString);
    const validated = exportDataSchema.parse(parsed);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      throw new Error('Az importált fájl formátuma érvénytelen');
    }
    throw new Error('A fájl feldolgozása sikertelen');
  }
}

/**
 * Import strategy
 */
export type ImportStrategy = 'merge' | 'replace' | 'skip';

/**
 * Import data from JSON
 */
export async function importData(
  data: ExportData,
  strategy: ImportStrategy = 'merge'
): Promise<ImportResult> {
  try {
    let notesImported = 0;
    let todosImported = 0;
    let conflicts = 0;

    // Import notes
    for (const note of data.notes) {
      const existing = await db.notes.get(note.id);

      if (existing) {
        conflicts++;
        if (strategy === 'skip') continue;
        if (strategy === 'replace') {
          await db.notes.put(note);
          notesImported++;
        }
        // For 'merge', keep the newer one
        if (strategy === 'merge') {
          const existingDate = new Date(existing.updatedAt).getTime();
          const importDate = new Date(note.updatedAt).getTime();
          if (importDate > existingDate) {
            await db.notes.put(note);
            notesImported++;
          }
        }
      } else {
        await db.notes.add(note);
        notesImported++;
      }
    }

    // Import todos
    for (const todo of data.todos) {
      const existing = await db.todos.get(todo.id);

      if (existing) {
        conflicts++;
        if (strategy === 'skip') continue;
        if (strategy === 'replace') {
          await db.todos.put(todo);
          todosImported++;
        }
        // For 'merge', keep the newer one
        if (strategy === 'merge') {
          const existingDate = new Date(existing.updatedAt).getTime();
          const importDate = new Date(todo.updatedAt).getTime();
          if (importDate > existingDate) {
            await db.todos.put(todo);
            todosImported++;
          }
        }
      } else {
        await db.todos.add(todo);
        todosImported++;
      }
    }

    // Import settings (always replace)
    await db.settings.put(data.settings);

    return {
      success: true,
      message: 'Az import sikeresen befejeződött',
      notesImported,
      todosImported,
      conflicts,
    };
  } catch (error) {
    console.error('Import error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Az import sikertelen',
      notesImported: 0,
      todosImported: 0,
      conflicts: 0,
    };
  }
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };
    reader.onerror = () => reject(new Error('A fájl olvasása sikertelen'));
    reader.readAsText(file);
  });
}

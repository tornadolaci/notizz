import type { INote, ITodo } from '$lib/types';

/**
 * Search result type
 */
export interface ISearchResult<T> {
  item: T;
  score: number;
  matches: string[];
}

/**
 * Simple fuzzy search implementation
 * Returns a score between 0 and 1 based on how well the search term matches the text
 */
function fuzzyScore(searchTerm: string, text: string): number {
  const search = searchTerm.toLowerCase();
  const target = text.toLowerCase();

  // Exact match gets highest score
  if (target === search) return 1;

  // Contains search term gets high score
  if (target.includes(search)) return 0.8;

  // Check character-by-character fuzzy match
  let searchIndex = 0;
  let targetIndex = 0;
  let matches = 0;

  while (searchIndex < search.length && targetIndex < target.length) {
    if (search[searchIndex] === target[targetIndex]) {
      matches++;
      searchIndex++;
    }
    targetIndex++;
  }

  // Calculate score based on matched characters
  if (matches === search.length) {
    return 0.5 * (matches / search.length) * (matches / target.length);
  }

  return 0;
}

/**
 * Search notes by title, content, and tags
 */
export function searchNotes(
  notes: INote[],
  searchTerm: string
): ISearchResult<INote>[] {
  if (!searchTerm.trim()) return [];

  const results: ISearchResult<INote>[] = [];

  for (const note of notes) {
    const matches: string[] = [];
    let maxScore = 0;

    // Search in title
    const titleScore = fuzzyScore(searchTerm, note.title);
    if (titleScore > 0) {
      matches.push('title');
      maxScore = Math.max(maxScore, titleScore * 1.5); // Title matches are more important
    }

    // Search in content
    const contentScore = fuzzyScore(searchTerm, note.content);
    if (contentScore > 0) {
      matches.push('content');
      maxScore = Math.max(maxScore, contentScore);
    }

    // Search in tags
    for (const tag of note.tags) {
      const tagScore = fuzzyScore(searchTerm, tag);
      if (tagScore > 0) {
        matches.push('tag');
        maxScore = Math.max(maxScore, tagScore * 1.2); // Tag matches are important
        break; // Only count tags once
      }
    }

    // Add to results if any match found
    if (maxScore > 0) {
      results.push({
        item: note,
        score: maxScore,
        matches
      });
    }
  }

  // Sort by relevance (score) and then by update date
  return results.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 0.01) {
      return b.score - a.score;
    }
    return b.item.updatedAt.getTime() - a.item.updatedAt.getTime();
  });
}

/**
 * Search todos by title, items, and tags
 */
export function searchTodos(
  todos: ITodo[],
  searchTerm: string
): ISearchResult<ITodo>[] {
  if (!searchTerm.trim()) return [];

  const results: ISearchResult<ITodo>[] = [];

  for (const todo of todos) {
    const matches: string[] = [];
    let maxScore = 0;

    // Search in title
    const titleScore = fuzzyScore(searchTerm, todo.title);
    if (titleScore > 0) {
      matches.push('title');
      maxScore = Math.max(maxScore, titleScore * 1.5); // Title matches are more important
    }

    // Search in todo items
    for (const item of todo.items) {
      const itemScore = fuzzyScore(searchTerm, item.text);
      if (itemScore > 0) {
        matches.push('item');
        maxScore = Math.max(maxScore, itemScore);
        break; // Only count items once
      }
    }

    // Search in tags
    for (const tag of todo.tags) {
      const tagScore = fuzzyScore(searchTerm, tag);
      if (tagScore > 0) {
        matches.push('tag');
        maxScore = Math.max(maxScore, tagScore * 1.2); // Tag matches are important
        break; // Only count tags once
      }
    }

    // Add to results if any match found
    if (maxScore > 0) {
      results.push({
        item: todo,
        score: maxScore,
        matches
      });
    }
  }

  // Sort by relevance (score) and then by update date
  return results.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 0.01) {
      return b.score - a.score;
    }
    return b.item.updatedAt.getTime() - a.item.updatedAt.getTime();
  });
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

<script lang="ts">
  import { searchStore, totalResults, type SearchFilter } from '$lib/stores/search';
  import { notesStore } from '$lib/stores/notes';
  import { todosStore } from '$lib/stores/todos';
  import { debounce } from '$lib/utils/search';

  interface Props {
    placeholder?: string;
  }

  let { placeholder = 'Keresés jegyzetekben és TODO-kban...' }: Props = $props();

  let inputValue = $state('');
  let inputElement: HTMLInputElement | null = null;

  // Debounced search function
  const performSearch = debounce((query: string) => {
    searchStore.setQuery(query, $notesStore.value, $todosStore.value);
  }, 300);

  // Handle input change
  function handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    inputValue = target.value;
    performSearch(inputValue);
  }

  // Handle filter change
  function handleFilterChange(filter: SearchFilter): void {
    searchStore.setFilter(filter);
  }

  // Clear search
  function clearSearch(): void {
    inputValue = '';
    searchStore.clear();
    inputElement?.focus();
  }

  // Keyboard shortcuts
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      clearSearch();
    }
  }
</script>

<div class="search-bar">
  <div class="search-input-wrapper">
    <svg
      class="search-icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.35-4.35"></path>
    </svg>

    <input
      bind:this={inputElement}
      type="search"
      class="search-input"
      value={inputValue}
      oninput={handleInput}
      onkeydown={handleKeydown}
      {placeholder}
      aria-label="Keresés"
      autocomplete="off"
      spellcheck="false"
    />

    {#if inputValue}
      <button
        type="button"
        class="clear-button"
        onclick={clearSearch}
        aria-label="Keresés törlése"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    {/if}
  </div>

  <div class="search-filters">
    <button
      type="button"
      class="filter-button"
      class:active={$searchStore.filter === 'all'}
      onclick={() => handleFilterChange('all')}
      aria-label="Összes"
      aria-pressed={$searchStore.filter === 'all'}
    >
      Összes
    </button>
    <button
      type="button"
      class="filter-button"
      class:active={$searchStore.filter === 'notes'}
      onclick={() => handleFilterChange('notes')}
      aria-label="Csak jegyzetek"
      aria-pressed={$searchStore.filter === 'notes'}
    >
      Jegyzetek
    </button>
    <button
      type="button"
      class="filter-button"
      class:active={$searchStore.filter === 'todos'}
      onclick={() => handleFilterChange('todos')}
      aria-label="Csak TODO-k"
      aria-pressed={$searchStore.filter === 'todos'}
    >
      TODO-k
    </button>
  </div>

  {#if $searchStore.isActive}
    <div class="search-results-count">
      {$totalResults} találat
    </div>
  {/if}
</div>

<style>
  .search-bar {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-light);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 16px;
    color: var(--text-tertiary);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: var(--padding-input);
    padding-left: 48px;
    padding-right: 48px;
    border: 1px solid var(--border-light);
    border-radius: 12px;
    font-size: var(--text-base);
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: all 200ms ease;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-info);
    box-shadow:
      0 0 0 3px rgba(0, 122, 255, 0.1),
      0 2px 8px rgba(0, 122, 255, 0.1);
  }

  .search-input::placeholder {
    color: var(--text-tertiary);
  }

  /* Remove default search input styling */
  .search-input::-webkit-search-cancel-button {
    display: none;
  }

  .clear-button {
    position: absolute;
    right: 12px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--text-tertiary);
    border-radius: 50%;
    cursor: pointer;
    transition: all 200ms ease;
  }

  .clear-button:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .clear-button:active {
    transform: scale(0.95);
  }

  .search-filters {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .filter-button {
    padding: 8px 16px;
    border: 1px solid var(--border-medium);
    border-radius: 20px;
    background: var(--bg-primary);
    color: var(--text-secondary);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    cursor: pointer;
    transition: all 200ms ease;
    white-space: nowrap;
  }

  .filter-button:hover {
    background: var(--bg-secondary);
    border-color: var(--color-info);
  }

  .filter-button.active {
    background: var(--color-info);
    color: white;
    border-color: var(--color-info);
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  }

  .filter-button:active {
    transform: scale(0.98);
  }

  .search-results-count {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    text-align: center;
    padding: var(--space-2) 0;
    font-weight: var(--font-medium);
  }

  /* Responsive design */
  @media (min-width: 640px) {
    .search-bar {
      padding: var(--space-5) var(--space-6);
    }
  }

  /* Accessibility - high contrast mode */
  @media (prefers-contrast: high) {
    .search-input,
    .filter-button {
      border-width: 2px;
    }

    .filter-button.active {
      border-width: 3px;
    }
  }

  /* Dark mode support */
  [data-theme='dark'] .search-bar {
    background: var(--bg-secondary);
  }
</style>

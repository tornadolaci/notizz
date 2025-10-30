<script lang="ts">
  import { onMount } from 'svelte';
  import Header from '$lib/components/layout/Header.svelte';
  import FloatingActionButton from '$lib/components/common/FloatingActionButton.svelte';
  import NoteCard from '$lib/components/notes/NoteCard.svelte';
  import TodoCard from '$lib/components/todos/TodoCard.svelte';
  import NoteEditor from '$lib/components/notes/NoteEditor.svelte';
  import TodoEditor from '$lib/components/todos/TodoEditor.svelte';
  import { notesStore } from '$lib/stores/notes';
  import { todosStore } from '$lib/stores/todos';
  import type { INote, ITodo } from '$lib/types';

  // Editor state
  let isNoteEditorOpen = $state(false);
  let isTodoEditorOpen = $state(false);
  let isTypePickerOpen = $state(false);
  let editingNote = $state<INote | null>(null);
  let editingTodo = $state<ITodo | null>(null);

  // Load data on mount
  onMount(async () => {
    await Promise.all([
      notesStore.load(),
      todosStore.load()
    ]);
  });

  // Combined and sorted items
  const items = $derived.by(() => {
    const allItems: Array<{type: 'note' | 'todo', data: INote | ITodo}> = [
      ...notesStore.notes.value.map(note => ({type: 'note' as const, data: note})),
      ...todosStore.todos.value.map(todo => ({type: 'todo' as const, data: todo}))
    ];

    // Sort by updatedAt (newest first), with urgent items first
    return allItems.sort((a, b) => {
      if (a.data.isUrgent !== b.data.isUrgent) {
        return a.data.isUrgent ? -1 : 1;
      }
      return b.data.updatedAt.getTime() - a.data.updatedAt.getTime();
    });
  });

  function handleFabClick() {
    isTypePickerOpen = true;
  }

  function openNoteEditor(note?: INote) {
    editingNote = note || null;
    isNoteEditorOpen = true;
    isTypePickerOpen = false;
  }

  function openTodoEditor(todo?: ITodo) {
    editingTodo = todo || null;
    isTodoEditorOpen = true;
    isTypePickerOpen = false;
  }

  function closeNoteEditor() {
    isNoteEditorOpen = false;
    editingNote = null;
  }

  function closeTodoEditor() {
    isTodoEditorOpen = false;
    editingTodo = null;
  }

  function closeTypePicker() {
    isTypePickerOpen = false;
  }

  async function handleNoteDelete(id: string) {
    if (confirm('Biztosan törölni szeretnéd ezt a jegyzetet?')) {
      await notesStore.remove(id);
    }
  }

  async function handleTodoDelete(id: string) {
    if (confirm('Biztosan törölni szeretnéd ezt a teendőt?')) {
      await todosStore.remove(id);
    }
  }

  async function handleTodoToggle(todoId: string, itemId: string) {
    await todosStore.toggleItem(todoId, itemId);
  }
</script>

<Header />

<main class="container">
  <div class="note-grid">
    {#each items as item, index (item.data.id)}
      {#if item.type === 'note'}
        <NoteCard
          note={item.data as INote}
          index={index}
          onEdit={() => openNoteEditor(item.data as INote)}
          onDelete={() => handleNoteDelete(item.data.id!)}
        />
      {:else}
        <TodoCard
          todo={item.data as ITodo}
          index={index}
          onEdit={() => openTodoEditor(item.data as ITodo)}
          onDelete={() => handleTodoDelete(item.data.id!)}
          onToggleItem={handleTodoToggle}
        />
      {/if}
    {/each}
  </div>
</main>

<FloatingActionButton onclick={handleFabClick} />

<!-- Type Picker Modal -->
{#if isTypePickerOpen}
  <div class="modal-backdrop" onclick={closeTypePicker}>
    <div class="type-picker" onclick={(e) => e.stopPropagation()}>
      <h2 class="type-picker-title">Új elem létrehozása</h2>
      <div class="type-buttons">
        <button class="type-button" onclick={() => openNoteEditor()}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Jegyzet</span>
        </button>
        <button class="type-button" onclick={() => openTodoEditor()}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Teendő</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Editors -->
<NoteEditor bind:isOpen={isNoteEditorOpen} onClose={closeNoteEditor} note={editingNote} />
<TodoEditor bind:isOpen={isTodoEditorOpen} onClose={closeTodoEditor} todo={editingTodo} />

<style>
  .container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 env(safe-area-inset-right) 0 env(safe-area-inset-left);
    flex: 1;
  }

  .note-grid {
    display: grid;
    gap: var(--gap-cards);
    padding: var(--space-4);
    grid-template-columns: 1fr;
  }

  @media (min-width: 640px) {
    .note-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .note-grid {
      grid-template-columns: repeat(3, minmax(280px, 1fr));
      max-width: 1000px;
      margin: 0 auto;
    }
  }

  /* Type Picker Modal */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 200ms ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .type-picker {
    background: var(--bg-primary);
    border-radius: 24px;
    padding: var(--padding-modal);
    max-width: 400px;
    width: 90vw;
    animation: slideUp 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
    box-shadow:
      0 10px 40px rgba(0, 0, 0, 0.2),
      0 24px 80px rgba(0, 0, 0, 0.1);
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .type-picker-title {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-5) 0;
    text-align: center;
  }

  .type-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
  }

  .type-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-6);
    background: var(--bg-secondary);
    border: 2px solid transparent;
    border-radius: 16px;
    cursor: pointer;
    transition: all 200ms ease;
    color: var(--text-primary);
    font-size: var(--text-base);
    font-weight: var(--font-medium);
  }

  .type-button:hover {
    background: var(--bg-tertiary);
    border-color: var(--color-info);
    transform: translateY(-2px);
  }

  .type-button:active {
    transform: translateY(0) scale(0.98);
  }

  .type-button svg {
    color: var(--color-info);
  }

  /* Dark mode */
  :global([data-theme="dark"]) .type-picker {
    background: var(--dark-bg-secondary);
  }
</style>

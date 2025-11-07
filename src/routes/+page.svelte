<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { get } from 'svelte/store';
  import Header from '$lib/components/layout/Header.svelte';
  import FloatingActionButton from '$lib/components/common/FloatingActionButton.svelte';
  import NoteCard from '$lib/components/notes/NoteCard.svelte';
  import TodoCard from '$lib/components/todos/TodoCard.svelte';
  import NoteEditor from '$lib/components/notes/NoteEditor.svelte';
  import TodoEditor from '$lib/components/todos/TodoEditor.svelte';
  import EmptyState from '$lib/components/shared/EmptyState.svelte';
  import { notesStore } from '$lib/stores/notes';
  import { todosStore } from '$lib/stores/todos';
  import type { INote, ITodo } from '$lib/types';

  // Editor state
  let isNoteEditorOpen = $state(false);
  let isTodoEditorOpen = $state(false);
  let isTypePickerOpen = $state(false);
  let editingNote = $state<INote | null>(null);
  let editingTodo = $state<ITodo | null>(null);
  let typePickerScrollPosition = 0;

  // Load data on mount
  onMount(async () => {
    await Promise.all([
      notesStore.load(),
      todosStore.load()
    ]);

    // Migration: Initialize order field for existing items without it
    const migrateOrders = async () => {
      const notes = get(notesStore).value;
      const todos = get(todosStore).value;

      let needsMigration = false;
      const allItems = [...notes, ...todos];

      // Check if any items are missing order field
      for (const item of allItems) {
        if (item.order === undefined || item.order === null) {
          needsMigration = true;
          break;
        }
      }

      if (needsMigration) {
        // Combine all items with their type and sort by updatedAt to preserve original order
        const combinedItems = [
          ...notes.map(note => ({ item: note, type: 'note' as const })),
          ...todos.map(todo => ({ item: todo, type: 'todo' as const }))
        ].sort((a, b) => b.item.updatedAt.getTime() - a.item.updatedAt.getTime());

        // Assign sequential order values
        const updates: Promise<void>[] = [];

        for (let i = 0; i < combinedItems.length; i++) {
          const { item, type } = combinedItems[i];
          if (item.order === undefined || item.order === null) {
            const newOrder = i * 1000; // Sequential with gaps

            if (type === 'note') {
              updates.push(notesStore.update(item.id!, { order: newOrder }));
            } else {
              updates.push(todosStore.update(item.id!, { order: newOrder }));
            }
          }
        }

        // Wait for all updates to complete
        await Promise.all(updates);

        // Reload to get fresh data
        await Promise.all([
          notesStore.load(),
          todosStore.load()
        ]);
      }
    };

    await migrateOrders();

    // Cleanup on unmount
    return () => {
      // Ensure body styles are cleaned up
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('top');
      document.body.style.removeProperty('width');
    };
  });

  // Handle scroll lock for type picker modal
  $effect(() => {
    if (isTypePickerOpen) {
      // Save current scroll position
      typePickerScrollPosition = window.scrollY || document.documentElement.scrollTop;

      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${typePickerScrollPosition}px`;
      document.body.style.width = '100%';
    } else {
      // Unlock body scroll and restore position
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('top');
      document.body.style.removeProperty('width');

      // Restore scroll position
      window.scrollTo(0, typePickerScrollPosition);
    }
  });

  // Subscribe to stores for reactivity using $effect
  let notesState = $state({ value: [], loading: false, error: null });
  let todosState = $state({ value: [], loading: false, error: null });

  $effect(() => {
    const unsubNotes = notesStore.subscribe((state) => {
      notesState = state;
    });
    const unsubTodos = todosStore.subscribe((state) => {
      todosState = state;
    });

    return () => {
      unsubNotes();
      unsubTodos();
    };
  });

  // Combined and sorted items
  const items = $derived.by(() => {
    const allItems: Array<{type: 'note' | 'todo', data: INote | ITodo}> = [
      ...notesState.value.map(note => ({type: 'note' as const, data: note})),
      ...todosState.value.map(todo => ({type: 'todo' as const, data: todo}))
    ];

    // Sort by order field only - manual ordering takes precedence over urgent flag
    return allItems.sort((a, b) => {
      return a.data.order - b.data.order;
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

  async function handleMoveUp(id: string, type: 'note' | 'todo') {
    const currentIndex = items.findIndex(item => item.data.id === id);
    if (currentIndex <= 0) return;

    const currentItem = items[currentIndex];
    const previousItem = items[currentIndex - 1];

    // Swap order values between current and previous items
    const currentOrder = currentItem.data.order;
    const previousOrder = previousItem.data.order;

    // Update BOTH items simultaneously using Promise.all
    // This prevents race conditions and ensures atomic updates
    await Promise.all([
      type === 'note'
        ? notesStore.update(id, { order: previousOrder })
        : todosStore.update(id, { order: previousOrder }),
      previousItem.type === 'note'
        ? notesStore.update(previousItem.data.id!, { order: currentOrder })
        : todosStore.update(previousItem.data.id!, { order: currentOrder })
    ]);
  }

  async function handleMoveDown(id: string, type: 'note' | 'todo') {
    const currentIndex = items.findIndex(item => item.data.id === id);
    if (currentIndex < 0 || currentIndex >= items.length - 1) return;

    const currentItem = items[currentIndex];
    const nextItem = items[currentIndex + 1];

    // Swap order values between current and next items
    const currentOrder = currentItem.data.order;
    const nextOrder = nextItem.data.order;

    // Update BOTH items simultaneously using Promise.all
    // This prevents race conditions and ensures atomic updates
    await Promise.all([
      type === 'note'
        ? notesStore.update(id, { order: nextOrder })
        : todosStore.update(id, { order: nextOrder }),
      nextItem.type === 'note'
        ? notesStore.update(nextItem.data.id!, { order: currentOrder })
        : todosStore.update(nextItem.data.id!, { order: currentOrder })
    ]);
  }
</script>

<Header />

<main class="container">
  {#if items.length > 0}
    <div class="note-grid">
      {#each items as item, index (item.data.id)}
        {#if item.type === 'note'}
          <NoteCard
            note={item.data as INote}
            index={index}
            onEdit={() => openNoteEditor(item.data as INote)}
            onDelete={() => handleNoteDelete(item.data.id!)}
            onMoveUp={() => handleMoveUp(item.data.id!, 'note')}
            onMoveDown={() => handleMoveDown(item.data.id!, 'note')}
            isFirst={index === 0}
            isLast={index === items.length - 1}
          />
        {:else}
          <TodoCard
            todo={item.data as ITodo}
            index={index}
            onEdit={() => openTodoEditor(item.data as ITodo)}
            onDelete={() => handleTodoDelete(item.data.id!)}
            onToggleItem={handleTodoToggle}
            onMoveUp={() => handleMoveUp(item.data.id!, 'todo')}
            onMoveDown={() => handleMoveDown(item.data.id!, 'todo')}
            isFirst={index === 0}
            isLast={index === items.length - 1}
          />
        {/if}
      {/each}
    </div>
  {:else if $notesStore.value.length === 0 && $todosStore.value.length === 0}
    <!-- No items at all -->
    <EmptyState
      icon="general"
      title="Üdvözlünk a Notizz-ben!"
      message="Még nincsenek jegyzeteid vagy teendőid. Kattints a jobb alsó sarokban található gombra az első elem létrehozásához."
      actionLabel="Új elem létrehozása"
      onaction={handleFabClick}
    />
  {/if}
</main>

<FloatingActionButton onclick={handleFabClick} />

<!-- Type Picker Modal -->
{#if isTypePickerOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="modal-backdrop" role="dialog" aria-modal="true" onclick={closeTypePicker} onkeydown={(e) => e.key === 'Escape' && closeTypePicker()}>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="type-picker" role="document" onclick={(e) => e.stopPropagation()}>
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
    max-width: 100%;
    width: 100%;
    margin: 0 auto;
    padding: 0;
    padding-top: 90px;
    flex: 1;
    overflow-x: hidden;
    box-sizing: border-box;
  }

  @media (min-width: 1024px) {
    .container {
      max-width: 1000px;
    }
  }

  .note-grid {
    display: grid;
    gap: var(--gap-cards);
    padding: var(--space-3);
    padding-bottom: var(--space-6);
    grid-template-columns: 1fr;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  @media (max-width: 640px) {
    .container {
      padding-top: 80px;
    }
  }

  @media (max-width: 375px) {
    .container {
      padding-top: 70px;
    }

    .note-grid {
      padding: 8px;
      padding-bottom: max(24px, env(safe-area-inset-bottom));
      gap: 16px;
    }
  }

  @media (min-width: 640px) {
    .note-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .note-grid {
      grid-template-columns: repeat(3, 1fr);
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
    padding: var(--space-4);
    box-sizing: border-box;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .type-picker {
    background: var(--bg-primary);
    border-radius: 24px;
    padding: var(--padding-modal);
    width: 100%;
    max-width: min(400px, calc(100vw - 32px));
    box-sizing: border-box;
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
    min-width: 0;
    box-sizing: border-box;
  }

  @media (max-width: 375px) {
    .type-button {
      padding: var(--space-4);
      font-size: var(--text-sm);
    }

    .type-button svg {
      width: 32px;
      height: 32px;
    }

    .type-picker {
      padding: var(--space-5);
      border-radius: 16px;
    }

    .type-picker-title {
      font-size: var(--text-base);
      margin-bottom: var(--space-4);
    }

    .type-buttons {
      gap: var(--space-3);
    }
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

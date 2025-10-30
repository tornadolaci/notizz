<script lang="ts">
  import { onMount } from 'svelte';
  import Header from '$lib/components/layout/Header.svelte';
  import FloatingActionButton from '$lib/components/common/FloatingActionButton.svelte';
  import NoteCard from '$lib/components/notes/NoteCard.svelte';
  import TodoCard from '$lib/components/todos/TodoCard.svelte';
  import { notesStore } from '$lib/stores/notes';
  import { todosStore } from '$lib/stores/todos';
  import type { INote, ITodo } from '$lib/types';

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
    // TODO: Open modal for creating new note/todo
    console.log('FAB clicked');
  }
</script>

<Header />

<main class="container">
  <div class="note-grid">
    {#each items as item, index (item.data.id)}
      {#if item.type === 'note'}
        <NoteCard note={item.data as INote} index={index} />
      {:else}
        <TodoCard todo={item.data as ITodo} index={index} />
      {/if}
    {/each}
  </div>
</main>

<FloatingActionButton onclick={handleFabClick} />

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
</style>

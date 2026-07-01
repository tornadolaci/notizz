<script lang="ts">
  import { onMount } from 'svelte';
  import { router } from 'tinro';
  import { get } from 'svelte/store';
  import type { INote } from '$lib/types';
  import { notesStore } from '$lib/stores/notes';
  import { isInitialized } from '$lib/stores/auth';
  import { PASTEL_COLORS, DEFAULT_NOTE_COLOR } from '$lib/constants/colors';
  import { generateId } from '$lib/utils/uuid';

  let errorMessage = $state<string | null>(null);

  // Auth is initialized asynchronously in the layout's onMount, which can
  // finish after this page mounts - wait for it, otherwise the store would
  // reject the save as unauthenticated even with a valid session
  function waitForAuthInit(): Promise<void> {
    if (get(isInitialized)) return Promise.resolve();
    return new Promise((resolve) => {
      // The early return above guarantees the first (synchronous) callback
      // fires with false, so unsubscribe is always assigned before use
      const unsubscribe = isInitialized.subscribe((initialized) => {
        if (initialized) {
          unsubscribe();
          resolve();
        }
      });
    });
  }

  onMount(async () => {
    try {
      // Shared params live in the hash query (#/share-target?title=...);
      // fall back to the search string for direct navigations
      const hashQueryStart = window.location.hash.indexOf('?');
      const params = new URLSearchParams(
        hashQueryStart >= 0
          ? window.location.hash.slice(hashQueryStart + 1)
          : window.location.search
      );
      const title = params.get('title') || undefined;
      const text = params.get('text') || undefined;
      const sharedUrl = params.get('url') || undefined;

      // Create a new note from shared content
      if (title || text || sharedUrl) {
        await waitForAuthInit();

        const noteContent = [
          text || '',
          sharedUrl ? `\n\nForrás: ${sharedUrl}` : ''
        ].filter(Boolean).join('');

        const now = new Date();
        const newNote: INote = {
          id: generateId(),
          title: title || 'Megosztott tartalom',
          content: noteContent,
          color: PASTEL_COLORS[DEFAULT_NOTE_COLOR],
          createdAt: now,
          updatedAt: now,
          order: Date.now()
        };
        await notesStore.add(newNote);
      }

      // Redirect to home page after processing
      setTimeout(() => {
        router.goto('/');
      }, 1500);
    } catch (error) {
      console.error('Error processing shared content:', error);
      errorMessage = 'Nem sikerült menteni a megosztott tartalmat.';
    }
  });
</script>

<svelte:head>
  <title>Tartalom megosztása - Notizz</title>
</svelte:head>

<div class="share-target-container">
  <div class="share-content">
    {#if errorMessage}
      <h2>Hiba történt</h2>
      <p>{errorMessage}</p>
      <a class="home-link" href="/">Vissza a főoldalra</a>
    {:else}
      <div class="loader">
        <div class="spinner"></div>
      </div>
      <h2>Tartalom feldolgozása...</h2>
      <p>A megosztott tartalom hamarosan jegyzetként lesz mentve.</p>
    {/if}
  </div>
</div>

<style>
  .share-target-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: var(--space-4);
    background: var(--bg-secondary);
  }

  .share-content {
    text-align: center;
    max-width: 400px;
  }

  .loader {
    margin-bottom: var(--space-6);
  }

  .spinner {
    width: 64px;
    height: 64px;
    margin: 0 auto;
    border: 4px solid var(--bg-tertiary);
    border-top-color: var(--color-info);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  h2 {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-3);
  }

  p {
    font-size: var(--text-base);
    color: var(--text-secondary);
    line-height: var(--leading-normal);
  }

  .home-link {
    display: inline-block;
    margin-top: var(--space-4);
    padding: var(--space-3) var(--space-5);
    min-height: 44px;
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: #ffffff;
    background: var(--color-info);
    border-radius: 12px;
    text-decoration: none;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation: none;
      border-top-color: var(--color-info);
    }
  }
</style>

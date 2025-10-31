<script lang="ts">
  import { onMount } from 'svelte';
  import { router } from 'tinro';
  import { notesStore } from '$lib/stores/notes';

  let shareData: {
    title?: string;
    text?: string;
    url?: string;
  } = $state({});

  let isProcessing = $state(true);

  onMount(async () => {
    try {
      // Extract data from POST request (FormData)
      const url = new URL(window.location.href);
      const params = new URLSearchParams(url.search);

      shareData = {
        title: params.get('title') || undefined,
        text: params.get('text') || undefined,
        url: params.get('url') || undefined,
      };

      // Create a new note from shared content
      if (shareData.title || shareData.text || shareData.url) {
        const noteContent = [
          shareData.text || '',
          shareData.url ? `\n\nForrás: ${shareData.url}` : ''
        ].filter(Boolean).join('');

        await notesStore.create({
          title: shareData.title || 'Megosztott tartalom',
          content: noteContent,
          color: 'lavender',
          tags: ['megosztott'],
          isUrgent: false
        });
      }

      // Redirect to home page after processing
      setTimeout(() => {
        router.goto('/');
      }, 1500);
    } catch (error) {
      console.error('Error processing shared content:', error);
      router.goto('/');
    }
  });
</script>

<svelte:head>
  <title>Tartalom megosztása - Notizz</title>
</svelte:head>

<div class="share-target-container">
  <div class="share-content">
    <div class="loader">
      <div class="spinner"></div>
    </div>
    <h2>Tartalom feldolgozása...</h2>
    <p>A megosztott tartalom hamarosan jegyzetként lesz mentve.</p>
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

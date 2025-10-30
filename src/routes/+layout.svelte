<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import UpdatePrompt from '$lib/components/common/UpdatePrompt.svelte';
  import OfflineIndicator from '$lib/components/common/OfflineIndicator.svelte';

  let { children } = $props();

  // Theme initialization
  onMount(() => {
    const savedTheme = localStorage.getItem('theme') || 'auto';
    applyTheme(savedTheme as 'light' | 'dark' | 'auto');
  });

  function applyTheme(theme: 'light' | 'dark' | 'auto') {
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
</script>

<div class="app-container">
  {@render children()}
</div>

<!-- PWA components -->
<UpdatePrompt />
<OfflineIndicator />

<style>
  .app-container {
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--bg-secondary);
  }
</style>

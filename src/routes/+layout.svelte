<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import UpdatePrompt from '$lib/components/common/UpdatePrompt.svelte';
  import OfflineIndicator from '$lib/components/common/OfflineIndicator.svelte';
  import { settingsStore } from '$lib/stores/settings';
  import { themeStore } from '$lib/stores/theme';

  let { children } = $props();

  // Initialize settings and theme
  onMount(async () => {
    await settingsStore.init();
    themeStore.init();

    // Apply font size
    const fontSize = settingsStore.current.fontSize;
    const fontSizeValue = fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px';
    document.documentElement.style.setProperty('--text-base', fontSizeValue);
  });
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

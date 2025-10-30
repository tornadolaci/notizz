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

    // Subscribe to settings changes and apply font size
    settingsStore.subscribe((settings) => {
      const fontSizeValue = settings.fontSize === 'small' ? '14px' : settings.fontSize === 'large' ? '18px' : '16px';
      document.documentElement.style.setProperty('--text-base', fontSizeValue);
    });
  });
</script>

<div class="app-container page-enter">
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

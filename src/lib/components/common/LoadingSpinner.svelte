<script lang="ts">
  /**
   * LoadingSpinner Component
   * Animated loading spinner or dots
   */
  interface Props {
    type?: 'spinner' | 'dots';
    size?: string;
    className?: string;
  }

  let {
    type = 'spinner',
    size = '24px',
    className = ''
  }: Props = $props();
</script>

{#if type === 'spinner'}
  <div
    class="loading-spinner {className}"
    style="width: {size}; height: {size}"
    role="status"
    aria-label="Betöltés"
  >
    <span class="sr-only">Betöltés...</span>
  </div>
{:else}
  <div class="loading-dots {className}" role="status" aria-label="Betöltés">
    <span></span>
    <span></span>
    <span></span>
    <span class="sr-only">Betöltés...</span>
  </div>
{/if}

<style>
  /* Loading spinner and dots styles are defined in app.css */
</style>

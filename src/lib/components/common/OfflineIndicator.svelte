<script lang="ts">
  import { onMount } from 'svelte';

  let isOnline = $state(true);
  let showBanner = $state(false);

  onMount(() => {
    // Initialize online status
    isOnline = navigator.onLine;

    // Update online status on network changes
    const handleOnline = () => {
      isOnline = true;
      showBanner = true;

      // Hide success banner after 3 seconds
      setTimeout(() => {
        showBanner = false;
      }, 3000);
    };

    const handleOffline = () => {
      isOnline = false;
      showBanner = true;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });
</script>

{#if showBanner}
  <div
    class="offline-indicator"
    class:offline={!isOnline}
    class:online={isOnline}
    role="status"
    aria-live="polite"
  >
    <div class="indicator-content">
      {#if isOnline}
        <span class="indicator-icon">✅</span>
        <span class="indicator-text">Újra online vagy!</span>
      {:else}
        <span class="indicator-icon">📵</span>
        <span class="indicator-text">Offline mód - A változások automatikusan szinkronizálódnak</span>
      {/if}
    </div>
  </div>
{/if}

<style>
  .offline-indicator {
    position: fixed;
    top: calc(16px + env(safe-area-inset-top));
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    max-width: 500px;
    width: calc(100% - 32px);
    animation: slideDown 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  .indicator-content {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-radius: 16px;
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.15),
      0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .offline .indicator-content {
    background: rgba(255, 149, 0, 0.95);
    border: 1px solid rgba(255, 149, 0, 0.3);
    color: white;
  }

  .online .indicator-content {
    background: rgba(52, 199, 89, 0.95);
    border: 1px solid rgba(52, 199, 89, 0.3);
    color: white;
  }

  .indicator-icon {
    font-size: 20px;
    line-height: 1;
  }

  .indicator-text {
    flex: 1;
    line-height: var(--leading-normal);
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-100px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  /* Fade out animation when banner disappears */
  .offline-indicator {
    animation: slideDown 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55),
               fadeOut 400ms ease 2600ms forwards;
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .indicator-content {
      padding: var(--space-2) var(--space-3);
      font-size: var(--text-xs);
    }

    .indicator-icon {
      font-size: 16px;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .offline-indicator {
      animation: none;
    }
  }
</style>

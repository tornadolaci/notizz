<script lang="ts">
  import { onMount } from 'svelte';
  import { useRegisterSW } from 'virtual:pwa-register/svelte';

  const {
    needRefresh,
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('Service Worker registration error:', error);
    },
  });

  function close() {
    needRefresh.set(false);
  }

  async function update() {
    await updateServiceWorker(true);
  }
</script>

{#if $needRefresh}
  <div class="update-prompt" role="dialog" aria-labelledby="update-title" aria-describedby="update-desc">
    <div class="update-content">
      <div class="update-icon">🔄</div>
      <div class="update-text">
        <h3 id="update-title">Új verzió elérhető</h3>
        <p id="update-desc">Egy újabb verzió lett letöltve. Kattints a frissítés gombra az aktiváláshoz.</p>
      </div>
      <div class="update-actions">
        <button class="button button--primary" onclick={update} aria-label="Alkalmazás frissítése most">
          Frissítés most
        </button>
        <button class="button button--secondary" onclick={close} aria-label="Későbbi frissítés">
          Később
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .update-prompt {
    position: fixed;
    bottom: calc(24px + env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    max-width: 420px;
    width: calc(100% - 32px);
    animation: slideUp 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  .update-content {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    padding: var(--space-5);
    box-shadow:
      0 10px 40px rgba(0, 0, 0, 0.15),
      0 24px 80px rgba(0, 0, 0, 0.1);
  }

  :global([data-theme="dark"]) .update-content {
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .update-icon {
    font-size: 48px;
    text-align: center;
    margin-bottom: var(--space-3);
    animation: rotate 2s linear infinite;
  }

  .update-text {
    text-align: center;
    margin-bottom: var(--space-4);
  }

  .update-text h3 {
    font-size: var(--text-md);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-2);
  }

  .update-text p {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    line-height: var(--leading-normal);
  }

  .update-actions {
    display: flex;
    gap: var(--space-2);
  }

  .button {
    flex: 1;
    border-radius: 12px;
    padding: var(--padding-button);
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    border: none;
    cursor: pointer;
    transition: all 200ms ease;
    position: relative;
    overflow: hidden;
  }

  .button--primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .button--primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  .button--primary:active {
    transform: translateY(1px) scale(0.97);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    filter: brightness(0.9);
  }

  .button--secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .button--secondary:hover {
    background: var(--bg-secondary);
  }

  .button--secondary:active {
    transform: scale(0.97);
    filter: brightness(0.95);
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(100px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .update-prompt {
      bottom: calc(16px + env(safe-area-inset-bottom));
    }

    .update-actions {
      flex-direction: column;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .update-prompt,
    .update-icon {
      animation: none;
    }
  }
</style>

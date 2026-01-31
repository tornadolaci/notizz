<script lang="ts">
  import { themeStore } from '$lib/stores/theme';
  import { authUser, isInitialized } from '$lib/stores/auth';

  let currentTime = $state(new Date());

  // Update date daily
  $effect(() => {
    const interval = setInterval(() => {
      currentTime = new Date();
    }, 60000);

    return () => clearInterval(interval);
  });

  const formattedDate = $derived(() => {
    return currentTime.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  });

  // Theme toggle handler
  async function handleThemeToggle() {
    await themeStore.toggle();
  }

  // Sync status icon color - reactive
  const syncIconColor = $derived(() => {
    const user = $authUser;
    const initialized = $isInitialized;

    // Get sync status from global window property
    // @ts-expect-error - global window property
    const syncActive = typeof window !== 'undefined' && window.__notizz_getSyncActive
      // @ts-expect-error - global window property
      ? window.__notizz_getSyncActive()
      : false;

    // Green if: initialized + logged in + sync active
    if (initialized && user && syncActive) {
      return 'var(--color-success)'; // #34C759
    }
    // Grey otherwise
    return '#8C8FA1';
  });

  // Force re-render when sync status might change
  let syncCheckInterval: ReturnType<typeof setInterval> | null = null;
  let syncColorTrigger = $state(0);

  $effect(() => {
    // Poll for sync status changes every 500ms for responsive UI
    syncCheckInterval = setInterval(() => {
      syncColorTrigger++;
    }, 500);

    return () => {
      if (syncCheckInterval) {
        clearInterval(syncCheckInterval);
      }
    };
  });

  // Reactive icon color that responds to trigger
  const iconColor = $derived(() => {
    // Reference trigger to force re-computation
    void syncColorTrigger;
    return syncIconColor();
  });
</script>

<header class="header">
  <div class="header__content">
    <div class="header__brand">
      <h1 class="header__title">Notizz!</h1>
      <p class="header__subtitle">{formattedDate()}</p>
    </div>
    <div class="header__actions">
      <button class="theme-toggle-button" onclick={handleThemeToggle} aria-label="Téma váltása">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      </button>
      <a href="#/settings" class="settings-button" aria-label="Beállítások" style="color: {iconColor()}">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <!-- Person/User icon (Material Design style) -->
          <circle cx="12" cy="8" r="4"/>
          <path d="M12 14c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z"/>
        </svg>
      </a>
    </div>
  </div>
</header>

<style>
  .header {
    background: linear-gradient(180deg, #FFFFFF 0%, #F4F6FB 100%);
    border-bottom: 1px solid var(--border-light);
    padding: var(--space-4);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    width: 100%;
    /* Soft Premium Light árnyék */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  /* Dark mode glass effect */
  :global([data-theme="dark"]) .header {
    background: rgba(28, 28, 30, 0.7);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .header__content {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    width: 100%;
    box-sizing: border-box;
  }

  .header__brand {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .header__title {
    font-size: var(--text-xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin: 0;
    background: linear-gradient(90deg, #7F7FD5, #5DA9FF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .header__subtitle {
    font-size: var(--text-base);
    color: #8C8FA1;
    margin: 0;
  }

  /* Dark mode - fehér dátum szöveg */
  :global([data-theme="dark"]) .header__subtitle {
    color: #FFFFFF;
  }

  .header__actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .theme-toggle-button {
    background: none;
    border: none;
    color: #F4C430;
    cursor: pointer;
    padding: var(--space-2);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 200ms ease;
  }

  .theme-toggle-button:hover {
    background: var(--bg-tertiary);
  }

  .theme-toggle-button:active {
    transform: scale(0.95);
  }

  .theme-toggle-button svg {
    filter: drop-shadow(0 0 2px rgba(244, 196, 48, 0.3));
  }

  .theme-toggle-button svg line {
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
  }

  .settings-button {
    background: none;
    border: none;
    /* color removed - now set via inline style */
    cursor: pointer;
    padding: var(--space-2);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 200ms ease;
    text-decoration: none;
  }

  .settings-button:hover {
    background: var(--bg-tertiary);
  }

  .settings-button:active {
    transform: scale(0.95);
  }

  @media (max-width: 640px) {
    .header {
      padding: var(--space-3);
    }

    .header__title {
      font-size: var(--text-lg);
    }

    .header__subtitle {
      font-size: var(--text-sm);
    }

    .header__actions {
      gap: var(--space-2);
    }
  }

  @media (max-width: 375px) {
    .header {
      padding: 8px 12px;
    }

    .header__content {
      gap: 8px;
    }

    .header__title {
      font-size: var(--text-base);
    }

    .header__subtitle {
      font-size: var(--text-sm);
    }

    .header__actions {
      gap: 6px;
    }

    .theme-toggle-button {
      padding: 4px;
    }

    .theme-toggle-button svg {
      width: 28px;
      height: 28px;
    }

    .settings-button {
      padding: 4px;
    }

    .settings-button svg {
      width: 28px;
      height: 28px;
    }
  }
</style>

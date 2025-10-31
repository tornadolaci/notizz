<script lang="ts">
  import { themeStore } from '$lib/stores/theme';

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
</script>

<header class="header">
  <div class="header__content">
    <div class="header__brand">
      <h1 class="header__title">Notizz</h1>
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
      <a href="#/settings" class="settings-button" aria-label="Beállítások">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
        </svg>
      </a>
    </div>
  </div>
</header>

<style>
  .header {
    background: rgba(255, 255, 255, 0.7);
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
  }

  /* Dark mode glass effect */
  [data-theme="dark"] .header {
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .header__subtitle {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    margin: 0;
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
    color: var(--color-info);
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
      font-size: var(--text-xs);
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
      font-size: 11px;
      max-width: 140px;
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

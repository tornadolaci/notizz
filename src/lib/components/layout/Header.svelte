<script lang="ts">
  let currentTime = $state(new Date());

  // Update time every minute
  $effect(() => {
    const interval = setInterval(() => {
      currentTime = new Date();
    }, 60000);

    return () => clearInterval(interval);
  });

  const formattedTime = $derived(() => {
    return currentTime.toLocaleTimeString('hu-HU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  });

  const formattedDate = $derived(() => {
    return currentTime.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  });
</script>

<header class="header">
  <div class="header__content">
    <div class="header__brand">
      <h1 class="header__title">Notizz</h1>
      <p class="header__subtitle">{formattedDate()}</p>
    </div>
    <div class="header__actions">
      <div class="header__time">
        <time class="time" datetime={currentTime.toISOString()}>
          {formattedTime()}
        </time>
      </div>
      <a href="#/settings" class="settings-button" aria-label="Beállítások">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-6.243 0L3.636 18.364M18.364 5.636l-4.243 4.243m-6.243 0L3.636 5.636" />
        </svg>
      </a>
    </div>
  </div>
</header>

<style>
  .header {
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-light);
    padding: var(--space-4) var(--space-4);
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .header__content {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
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

  .header__time {
    display: flex;
    align-items: center;
  }

  .time {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
  }

  .settings-button {
    background: none;
    border: none;
    color: var(--text-tertiary);
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
    color: var(--text-primary);
  }

  .settings-button:active {
    transform: scale(0.95);
  }

  @media (max-width: 640px) {
    .header__subtitle {
      font-size: var(--text-xs);
    }

    .time {
      font-size: var(--text-base);
    }
  }
</style>

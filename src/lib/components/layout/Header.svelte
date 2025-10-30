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
    <div class="header__time">
      <time class="time" datetime={currentTime.toISOString()}>
        {formattedTime()}
      </time>
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

  @media (max-width: 640px) {
    .header__subtitle {
      font-size: var(--text-xs);
    }

    .time {
      font-size: var(--text-base);
    }
  }
</style>

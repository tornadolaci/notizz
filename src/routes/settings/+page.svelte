<script lang="ts">
  /**
   * Settings Page
   * User preferences, data management, and authentication
   */

  import { onMount } from 'svelte';
  import { router } from 'tinro';
  import { settingsStore } from '$lib/stores/settings';
  import { authStore, isAuthenticated, authUser } from '$lib/stores/auth';

  // Reactive state
  let isLoggingOut = $state(false);
  let message = $state<string | null>(null);
  let error = $state<string | null>(null);

  // App version from vite.config.ts (reads from package.json at build time)
  const appVersion = __APP_VERSION__;

  // Derived state
  const authenticated = $derived($isAuthenticated);
  const user = $derived($authUser);

  // Initialize settings on mount
  onMount(async () => {
    await settingsStore.init();
  });

  function handleLogin() {
    // @ts-expect-error - global window property
    if (typeof window !== 'undefined' && window.__notizz_showAuth) {
      // @ts-expect-error - global window property
      window.__notizz_showAuth();
    }
  }

  async function handleLogout() {
    if (confirm('Biztosan ki szeretnél jelentkezni?')) {
      try {
        isLoggingOut = true;
        // @ts-expect-error - global window property
        if (typeof window !== 'undefined' && window.__notizz_logout) {
          // @ts-expect-error - global window property
          await window.__notizz_logout();
        }
        message = 'Sikeres kijelentkezés!';
        setTimeout(() => {
          message = null;
          router.goto('/');
        }, 1500);
      } catch (err) {
        error = 'A kijelentkezés sikertelen';
        setTimeout(() => (error = null), 3000);
      } finally {
        isLoggingOut = false;
      }
    }
  }

  function goBack() {
    router.goto('/');
  }
</script>

<div class="settings-page">
  <!-- Header -->
  <header class="settings-header">
    <button class="back-button" onclick={goBack} aria-label="Vissza">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </button>
    <h1>Beállítások</h1>
  </header>

  <div class="settings-container">
    <!-- Account Section -->
    <section class="settings-section">
      <h2 class="section-title">Fiók</h2>

      {#if authenticated && user}
        <div class="account-info">
          <div class="user-avatar">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div class="user-details">
            <p class="user-email">{user.email}</p>
            <p class="user-status">Bejelentkezve</p>
          </div>
        </div>

        <button
          class="action-button action-button--logout"
          onclick={handleLogout}
          disabled={isLoggingOut}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          {isLoggingOut ? 'Kijelentkezés...' : 'Kijelentkezés'}
        </button>
      {:else}
        <div class="account-info account-info--guest">
          <div class="user-avatar user-avatar--guest">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            </svg>
          </div>
          <div class="user-details">
            <p class="user-email">Vendég mód</p>
            <p class="user-status">Az adatok csak ezen az eszközön érhetők el</p>
          </div>
        </div>

        <button class="action-button action-button--login" onclick={handleLogin}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
          </svg>
          Bejelentkezés / Regisztráció
        </button>

        <p class="sync-info">
          Jelentkezz be, hogy szinkronizáld az adataidat több eszköz között!
        </p>
      {/if}
    </section>

    <!-- Messages -->
    {#if message}
      <div class="message message--success">{message}</div>
    {/if}
    {#if error}
      <div class="message message--error">{error}</div>
    {/if}

    <!-- App Info -->
    <section class="settings-section">
      <h2 class="section-title">Információ</h2>
      <div class="info-group">
        <p class="info-item">
          <span class="info-label">Verzió:</span>
          <span class="info-value">{appVersion}</span>
        </p>
        <p class="info-item">
          <span class="info-label">Build:</span>
          <span class="info-value">PWA</span>
        </p>
        {#if authenticated}
          <p class="info-item">
            <span class="info-label">Szinkronizálás:</span>
            <span class="info-value info-value--active">Aktív</span>
          </p>
        {/if}
      </div>
      <div class="creator-link">
        <a href="https://www.panora.hu" target="_blank" rel="noopener noreferrer">
          👉 created by panora.hu szoftverbázis
        </a>
      </div>
    </section>
  </div>
</div>

<style>
  .settings-page {
    min-height: 100vh;
    background: var(--bg-secondary);
    padding-bottom: var(--space-10);
    padding-top: 80px;
  }

  .settings-header {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-5) var(--space-4);
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-light);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
  }

  /* Dark mode glass effect for settings header */
  :global([data-theme="dark"]) .settings-header {
    background: rgba(28, 28, 30, 0.7);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .back-button {
    background: none;
    border: none;
    color: var(--color-info);
    cursor: pointer;
    padding: var(--space-2);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: background 200ms ease;
  }

  .back-button:hover {
    background: var(--bg-tertiary);
  }

  .settings-header h1 {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .settings-container {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--space-4);
  }

  .settings-section {
    background: var(--bg-primary);
    border-radius: 20px;
    padding: var(--space-6);
    margin-bottom: var(--space-4);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 4px 8px rgba(0, 0, 0, 0.06);
  }

  :global([data-theme="dark"]) .settings-section {
    background: var(--amoled-surface-1);
    border: 1px solid var(--amoled-border);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.55),
      0 10px 30px rgba(0, 0, 0, 0.55);
  }

  .section-title {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-5);
  }

  /* Account Section */
  .account-info {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4);
    background: var(--bg-secondary);
    border-radius: 16px;
    margin-bottom: var(--space-4);
  }

  .account-info--guest {
    background: rgba(0, 122, 255, 0.08);
  }

  .user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    flex-shrink: 0;
  }

  .user-avatar--guest {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
  }

  .user-details {
    flex: 1;
    min-width: 0;
  }

  .user-email {
    font-size: var(--text-base);
    font-weight: var(--font-medium);
    color: var(--text-primary);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-status {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    margin: var(--space-1) 0 0;
  }

  .sync-info {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    text-align: center;
    margin-top: var(--space-3);
    padding: var(--space-3);
    background: rgba(0, 122, 255, 0.05);
    border-radius: 8px;
  }

  /* Action Buttons */
  .action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-4);
    border: 2px solid var(--border-light);
    border-radius: 12px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: var(--text-base);
    font-weight: var(--font-medium);
    cursor: pointer;
    transition: all 200ms ease;
  }

  .action-button:hover:not(:disabled) {
    border-color: var(--color-info);
    background: var(--color-info);
    color: white;
  }

  .action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-button--login {
    border-color: var(--color-info);
    color: var(--color-info);
    background: rgba(0, 122, 255, 0.05);
  }

  .action-button--login:hover:not(:disabled) {
    background: var(--color-info);
    color: white;
  }

  .action-button--logout {
    border-color: var(--text-tertiary);
    color: var(--text-secondary);
    margin-top: 0;
  }

  .action-button--logout:hover:not(:disabled) {
    border-color: var(--color-error);
    background: var(--color-error);
    color: white;
  }

  /* Messages */
  .message {
    margin-top: var(--space-4);
    padding: var(--space-3) var(--space-4);
    border-radius: 12px;
    font-size: var(--text-sm);
    animation: slideUp 300ms ease;
  }

  .message--success {
    background: var(--color-success);
    color: white;
  }

  .message--error {
    background: var(--color-error);
    color: white;
  }

  /* Info */
  .info-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-base);
  }

  .info-label {
    color: var(--text-secondary);
  }

  .info-value {
    color: var(--text-primary);
    font-weight: var(--font-medium);
  }

  .info-value--active {
    color: var(--color-success);
  }

  .creator-link {
    margin-top: var(--space-5);
    padding-top: var(--space-4);
    border-top: 1px solid var(--border-light);
    text-align: center;
  }

  .creator-link a {
    color: #007AFF;
    font-size: var(--text-sm);
    text-decoration: none;
    transition: opacity 200ms ease;
  }

  .creator-link a:hover {
    opacity: 0.7;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Responsive */
  @media (max-width: 375px) {
    .settings-container {
      padding: var(--space-3);
    }

    .settings-section {
      padding: var(--space-4);
    }
  }

  @media (max-width: 640px) {
    .settings-page {
      padding-top: 75px;
    }
  }

  @media (max-width: 375px) {
    .settings-page {
      padding-top: 70px;
    }
  }

</style>

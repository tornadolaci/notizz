<script lang="ts">
  import '../app.css';
  import { onMount, onDestroy } from 'svelte';
  import { router } from 'tinro';
  import UpdatePrompt from '$lib/components/common/UpdatePrompt.svelte';
  import OfflineIndicator from '$lib/components/common/OfflineIndicator.svelte';
  import AuthModal from '$lib/components/auth/AuthModal.svelte';
  import AuthGate from '$lib/components/auth/AuthGate.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import { settingsStore } from '$lib/stores/settings';
  import { themeStore } from '$lib/stores/theme';
  import { authStore, isInitialized, authUser, isAuthenticated } from '$lib/stores/auth';
  import { notesStore } from '$lib/stores/notes';
  import { todosStore } from '$lib/stores/todos';
  import {
    startPolling,
    stopPolling,
    isOnline,
    initializePreviousState,
    registerSyncStatusCallback,
    unregisterSyncStatusCallback,
  } from '$lib/api';

  let { children } = $props();

  // Auth modal state
  let showAuthModal = $state(false);
  let appInitialized = $state(false);

  // Sync status for Header icon color
  let syncActive = $state(false);

  // Routes reachable without authentication (email links land here)
  const isPublicRoute = $derived($router.path === '/reset-password');

  // Polling cleanup
  let stopPollingFn: (() => void) | null = null;

  // Online status listener
  let handleOnline: (() => void) | null = null;

  // Initialize settings, theme, and auth
  onMount(async () => {
    await settingsStore.init();
    themeStore.init();

    // Set fixed font size to 18px
    document.documentElement.style.setProperty('--text-base', '18px');

    // Initialize auth state (validates the stored token against the backend)
    await authStore.initialize();

    // Register sync status callback for Header icon
    registerSyncStatusCallback((active) => {
      syncActive = active;
    });

    appInitialized = true;
  });

  // The user id sync is currently running for (plain variable on purpose:
  // it must not be an effect dependency). Makes the effect idempotent -
  // store re-notifications with the same user must not restart the sync.
  let syncUserId: string | null = null;

  // React to auth state changes
  $effect(() => {
    const user = $authUser;
    const initialized = $isInitialized;

    if (initialized && user && user.id !== syncUserId) {
      // User is logged in - setup sync
      syncUserId = user.id;
      setupSync(user.id);
    } else if (initialized && !user && syncUserId) {
      // User is logged out - cleanup
      syncUserId = null;
      cleanupSync();
    }
  });

  async function setupSync(userId: string) {
    try {
      // Load data from the API (stores handle this directly)
      await Promise.all([notesStore.load(), todosStore.load()]);

      // Initialize previous state with loaded data BEFORE starting sync
      // This prevents false "new content" notifications on app startup
      const currentNotes = notesStore.getNotes();
      const currentTodos = todosStore.getTodos();
      initializePreviousState(currentNotes, currentTodos);

      // Start polling (every 10 seconds) - the sole sync mechanism
      stopPollingFn = startPolling(
        userId,
        (notes) => {
          notesStore.setNotes(notes);
        },
        (todos) => {
          todosStore.setTodos(todos);
        }
      );

      // Listen for coming back online
      handleOnline = async () => {
        if (isOnline()) {
          console.log('Back online, reloading data...');
          await Promise.all([notesStore.load(), todosStore.load()]);
        }
      };
      window.addEventListener('online', handleOnline);
    } catch (error) {
      console.error('Error setting up sync:', error);
    }
  }

  function cleanupSync() {
    // Stop polling
    if (stopPollingFn) {
      stopPollingFn();
      stopPollingFn = null;
    }
    stopPolling();

    // Remove online listener
    if (handleOnline) {
      window.removeEventListener('online', handleOnline);
      handleOnline = null;
    }
  }

  // Handle successful login
  async function handleAuthSuccess() {
    showAuthModal = false;
    // Sync will be triggered by the auth state change effect
  }

  // Handle logout
  async function handleLogout() {
    // 1. First cleanup sync to stop all polling
    cleanupSync();

    // 2. Sign out via the API - revokes the token and clears the auth store;
    //    the auth gate takes over automatically
    await authStore.signOut();
  }

  onDestroy(() => {
    cleanupSync();
    unregisterSyncStatusCallback();
  });

  // Expose handlers globally for the settings page and Header
  // @ts-expect-error - global window property
  if (typeof window !== 'undefined') {
    // @ts-expect-error - global window property
    window.__notizz_logout = handleLogout;
    // @ts-expect-error - global window property
    window.__notizz_getSyncActive = () => syncActive;
  }
</script>

<div class="app-container page-enter">
  {#if !appInitialized}
    <div class="init-loading">
      <LoadingSpinner />
    </div>
  {:else if $isAuthenticated || isPublicRoute}
    {@render children()}
  {:else}
    <!-- Auth gate: the app is login-only -->
    <AuthGate onLogin={() => { showAuthModal = true; }} />
  {/if}
</div>

<!-- Auth Modal -->
<AuthModal
  bind:isOpen={showAuthModal}
  onClose={() => { showAuthModal = false; }}
  onSuccess={handleAuthSuccess}
/>

<!-- PWA components -->
<UpdatePrompt />
<OfflineIndicator />

<style>
  .app-container {
    min-height: 100vh;
    min-height: 100dvh;
    display: block;
    background: var(--bg-secondary);
    overflow-x: hidden;
    overflow-y: visible;
  }

  .init-loading {
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>

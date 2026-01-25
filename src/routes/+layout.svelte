<script lang="ts">
  import '../app.css';
  import { onMount, onDestroy } from 'svelte';
  import UpdatePrompt from '$lib/components/common/UpdatePrompt.svelte';
  import OfflineIndicator from '$lib/components/common/OfflineIndicator.svelte';
  import AuthModal from '$lib/components/auth/AuthModal.svelte';
  import WelcomeModal from '$lib/components/auth/WelcomeModal.svelte';
  import { settingsStore } from '$lib/stores/settings';
  import { themeStore } from '$lib/stores/theme';
  import { authStore, isInitialized, authUser } from '$lib/stores/auth';
  import { notesStore } from '$lib/stores/notes';
  import { todosStore } from '$lib/stores/todos';
  import {
    subscribeToChanges,
    unsubscribeFromChanges,
    startPolling,
    stopPolling,
    isOnline,
    initializePreviousState,
  } from '$lib/supabase';

  let { children } = $props();

  // Auth modal state
  let showAuthModal = $state(false);

  // Welcome modal state (first time user)
  let showWelcomeModal = $state(false);
  let appInitialized = $state(false);

  // LocalStorage key for tracking if user has made initial choice
  const WELCOME_COMPLETED_KEY = 'notizz_welcome_completed';

  // Real-time subscription cleanup
  let unsubscribeRealtime: (() => void) | null = null;

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

    // Initialize auth state
    await authStore.initialize();

    // Check if this is the first time user (after auth is initialized)
    const welcomeCompleted = localStorage.getItem(WELCOME_COMPLETED_KEY);
    const isLoggedIn = authStore.isAuthenticated();

    // Show welcome modal only if:
    // 1. User hasn't completed the welcome flow
    // 2. User is not already logged in
    if (!welcomeCompleted && !isLoggedIn) {
      showWelcomeModal = true;
    }

    appInitialized = true;
  });

  // React to auth state changes
  $effect(() => {
    const user = $authUser;
    const initialized = $isInitialized;

    if (initialized && user) {
      // User is logged in - setup sync
      setupSync(user.id);
    } else if (initialized && !user) {
      // User is logged out - cleanup
      cleanupSync();
    }
  });

  async function setupSync(userId: string) {
    try {
      // Load data from Supabase (stores handle this directly now)
      await Promise.all([notesStore.load(), todosStore.load()]);

      // Initialize previous state with loaded data BEFORE starting sync
      // This prevents false "new content" notifications on app startup
      const currentNotes = notesStore.getNotes();
      const currentTodos = todosStore.getTodos();
      initializePreviousState(currentNotes, currentTodos);

      // Subscribe to real-time changes
      unsubscribeRealtime = subscribeToChanges(
        userId,
        (notes) => {
          notesStore.setNotes(notes);
        },
        (todos) => {
          todosStore.setTodos(todos);
        }
      );

      // Start polling as a fallback for realtime (every 30 seconds)
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
    // Unsubscribe from real-time changes
    if (unsubscribeRealtime) {
      unsubscribeRealtime();
      unsubscribeRealtime = null;
    }
    unsubscribeFromChanges();

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
    // 1. First cleanup sync to stop all polling and realtime subscriptions
    cleanupSync();

    // 2. Sign out from Supabase - this will trigger onAuthStateChange
    //    which updates authStore to user: null
    await authStore.signOut();

    // 3. Small delay to ensure auth state is fully updated
    //    This prevents race conditions where sync callbacks might still fire
    await new Promise(resolve => setTimeout(resolve, 100));

    // 4. Now that auth is null, load guest data from IndexedDB
    //    Note: We intentionally do NOT clear local IndexedDB data here.
    //    This preserves guest notes/todos so they remain accessible after logout.
    await Promise.all([notesStore.load(), todosStore.load()]);

    // 5. Reset welcome modal state so it shows again on next app start
    localStorage.removeItem(WELCOME_COMPLETED_KEY);

    // 6. Show welcome modal immediately after logout
    showWelcomeModal = true;
  }

  onDestroy(() => {
    cleanupSync();
  });

  // Handle welcome modal choices
  function handleGuestMode() {
    // Mark welcome as completed
    localStorage.setItem(WELCOME_COMPLETED_KEY, 'true');
    showWelcomeModal = false;
  }

  function handleWelcomeLogin() {
    // Mark welcome as completed (will be confirmed after successful login)
    localStorage.setItem(WELCOME_COMPLETED_KEY, 'true');
    showWelcomeModal = false;
    showAuthModal = true;
  }

  // Expose logout handler globally for settings page
  // @ts-expect-error - global window property
  if (typeof window !== 'undefined') {
    // @ts-expect-error - global window property
    window.__notizz_logout = handleLogout;
    // @ts-expect-error - global window property
    window.__notizz_showAuth = () => { showAuthModal = true; };
  }
</script>

<div class="app-container page-enter">
  {@render children()}
</div>

<!-- Welcome Modal (first time user) -->
<WelcomeModal
  bind:isOpen={showWelcomeModal}
  onGuestMode={handleGuestMode}
  onLogin={handleWelcomeLogin}
/>

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
</style>

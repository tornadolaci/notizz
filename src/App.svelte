<script lang="ts">
  import { onMount } from 'svelte';
  import { router } from 'tinro';
  import { Route } from 'tinro';
  import Layout from './routes/+layout.svelte';
  import HomePage from './routes/+page.svelte';
  import SettingsPage from './routes/settings/+page.svelte';
  import ShareTargetPage from './routes/share-target/+page.svelte';
  import ResetPasswordPage from './routes/reset-password/+page.svelte';
  import { supabase } from '$lib/supabase/client';

  // Enable hash routing for better compatibility
  router.mode.hash();

  onMount(() => {
    // Handle Supabase recovery redirect after auth is processed
    // The index.html sets a sessionStorage flag when redirecting from /reset-password
    const shouldRedirectToReset = sessionStorage.getItem('notizz_recovery_redirect');

    console.log('[App] onMount - shouldRedirectToReset:', shouldRedirectToReset);
    console.log('[App] Current URL:', window.location.href);

    // Check for PKCE code in URL (Supabase PKCE flow)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      console.log('[App] PKCE code detected in URL, exchanging for session...');
      // Set the recovery flag BEFORE exchanging code
      // This ensures the reset-password page knows this is a valid recovery flow
      sessionStorage.setItem('notizz_recovery_redirect', 'true');

      // Exchange the code for a session
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          console.error('[App] Code exchange error:', error);
          // Clear flag on error
          sessionStorage.removeItem('notizz_recovery_redirect');
        } else {
          console.log('[App] Code exchange successful, session:', data.session?.user?.email);
          // Clear the code from URL
          window.history.replaceState({}, '', window.location.pathname + window.location.hash);
          // Redirect to reset-password page (flag will be checked there)
          router.goto('/reset-password');
        }
      });
    } else if (shouldRedirectToReset) {
      // DON'T clear the flag here - let reset-password page verify and clear it
      // This ensures the security check in reset-password works correctly

      // Wait for Supabase to process the auth hash, then redirect to reset-password
      const checkAuthAndRedirect = async () => {
        // Give Supabase a moment to process the hash
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if we have a session (meaning auth was successful)
        const { data: { session } } = await supabase.auth.getSession();

        console.log('[App] checkAuthAndRedirect - session:', session?.user?.email);

        if (session) {
          // Auth successful, now redirect to reset-password page
          router.goto('/reset-password');
        }
      };

      checkAuthAndRedirect();
    }

    // Also listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[App] Auth state change:', event, session?.user?.email);
      if (event === 'PASSWORD_RECOVERY') {
        // Set flag for PASSWORD_RECOVERY event as well
        sessionStorage.setItem('notizz_recovery_redirect', 'true');
        router.goto('/reset-password');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  });
</script>

<Layout>
  <Route path="/">
    <HomePage />
  </Route>
  <Route path="/settings">
    <SettingsPage />
  </Route>
  <Route path="/share-target">
    <ShareTargetPage />
  </Route>
  <Route path="/reset-password">
    <ResetPasswordPage />
  </Route>
</Layout>

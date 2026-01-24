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

    if (shouldRedirectToReset) {
      // Clear the flag
      sessionStorage.removeItem('notizz_recovery_redirect');

      // Wait for Supabase to process the auth hash, then redirect to reset-password
      const checkAuthAndRedirect = async () => {
        // Give Supabase a moment to process the hash
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if we have a session (meaning auth was successful)
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Auth successful, now redirect to reset-password page
          router.goto('/reset-password');
        }
      };

      checkAuthAndRedirect();
    }

    // Also listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
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

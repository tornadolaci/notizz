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
    console.log('[App] onMount - Current URL:', window.location.href);

    // Check for PKCE code in URL - this indicates a recovery/auth flow
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      console.log('[App] PKCE code detected, letting Supabase handle it...');
      // Don't do anything here - Supabase's detectSessionInUrl will handle the code
      // and fire the appropriate event
    }

    // Listen for auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[App] Auth state change:', event);
      console.log('[App] Session user:', session?.user?.email);
      console.log('[App] User app_metadata:', JSON.stringify(session?.user?.app_metadata));
      console.log('[App] User user_metadata:', JSON.stringify(session?.user?.user_metadata));

      if (event === 'PASSWORD_RECOVERY') {
        // Explicit recovery event (implicit flow)
        console.log('[App] PASSWORD_RECOVERY event detected!');
        sessionStorage.setItem('notizz_recovery_redirect', 'true');
        router.goto('/reset-password');
      } else if (event === 'SIGNED_IN' && session) {
        // For PKCE flow, check if this might be a recovery
        // The URL had a code parameter and now we're signed in
        const hadCode = sessionStorage.getItem('notizz_had_recovery_code');
        if (hadCode) {
          console.log('[App] SIGNED_IN after recovery code - treating as recovery');
          sessionStorage.removeItem('notizz_had_recovery_code');
          sessionStorage.setItem('notizz_recovery_redirect', 'true');
          router.goto('/reset-password');
        }
      }
    });

    // Only mark as recovery code if the URL path indicates password reset
    // Email confirmation redirects to '/' while password reset redirects to '/reset-password'
    // With hash routing, check both pathname and hash for reset-password indicator
    const isPasswordResetFlow = window.location.pathname.includes('reset-password') ||
                                 window.location.hash.includes('reset-password');

    if (code && isPasswordResetFlow) {
      console.log('[App] Password reset code detected (URL contains reset-password)');
      sessionStorage.setItem('notizz_had_recovery_code', 'true');
    } else if (code) {
      console.log('[App] Auth code detected but NOT password reset (email confirmation or other)');
      // Don't set recovery flag - this is likely email confirmation
    }

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

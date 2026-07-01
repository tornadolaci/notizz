<script lang="ts">
  import { router } from 'tinro';
  import { Route } from 'tinro';
  import Layout from './routes/+layout.svelte';
  import HomePage from './routes/+page.svelte';
  import SettingsPage from './routes/settings/+page.svelte';
  import ShareTargetPage from './routes/share-target/+page.svelte';
  import ResetPasswordPage from './routes/reset-password/+page.svelte';

  // Enable hash routing for better compatibility
  // The password reset email links directly to #/reset-password?token=...,
  // so no OAuth/PKCE detection is needed here anymore
  router.mode.hash();
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

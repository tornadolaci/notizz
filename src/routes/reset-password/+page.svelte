<script lang="ts">
  /**
   * Reset Password Page
   * Handles password reset after clicking email link from Supabase
   */

  import { onMount } from 'svelte';
  import { router } from 'tinro';
  import { supabase } from '$lib/supabase/client';
  import { updatePassword } from '$lib/supabase/auth.service';

  // Form state
  let password = $state('');
  let confirmPassword = $state('');
  let loading = $state(false);
  let error = $state('');
  let success = $state(false);
  let showPassword = $state(false);
  let showConfirmPassword = $state(false);
  let sessionReady = $state(false);
  let sessionError = $state('');

  onMount(async () => {
    // Supabase automatically handles the recovery token from URL hash
    // We need to wait for the session to be established
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event on reset-password:', event);

      if (event === 'PASSWORD_RECOVERY') {
        // Session is ready for password update
        sessionReady = true;
      } else if (event === 'SIGNED_IN' && session) {
        // User already signed in via recovery link
        sessionReady = true;
      }
    });

    // Also check current session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      sessionReady = true;
    }

    // Set a timeout to show error if session doesn't load
    setTimeout(() => {
      if (!sessionReady && !success) {
        sessionError = 'A jelszó-visszaállító link érvénytelen vagy lejárt. Kérj új linket.';
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
    };
  });

  function validateForm(): boolean {
    error = '';

    if (!password || password.length < 6) {
      error = 'A jelszónak legalább 6 karakter hosszúnak kell lennie.';
      return false;
    }

    if (password !== confirmPassword) {
      error = 'A jelszavak nem egyeznek.';
      return false;
    }

    return true;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    loading = true;
    error = '';

    try {
      const result = await updatePassword(password);

      if (result.success) {
        success = true;
        // Redirect to home after 2 seconds
        setTimeout(() => {
          router.goto('/');
        }, 2000);
      } else {
        error = result.error || 'Nem sikerült frissíteni a jelszót.';
      }
    } catch {
      error = 'Váratlan hiba történt. Kérjük, próbáld újra.';
    } finally {
      loading = false;
    }
  }

  function goToHome() {
    router.goto('/');
  }

  function goToForgotPassword() {
    // Navigate to home and trigger auth modal with forgot password mode
    router.goto('/');
    // The user will need to manually open the auth modal
  }
</script>

<div class="reset-page">
  <div class="reset-container">
    <div class="reset-card">
      <!-- Header -->
      <div class="reset-header">
        <h1>Jelszó visszaállítás</h1>
        <p class="reset-subtitle">Add meg az új jelszavadat</p>
      </div>

      <!-- Content -->
      <div class="reset-content">
        {#if sessionError}
          <div class="error-message" role="alert">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" stroke-width="2"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke-width="2" stroke-linecap="round"/>
              <line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>{sessionError}</span>
          </div>

          <button class="action-button" onclick={goToForgotPassword}>
            Új link kérése
          </button>
        {:else if success}
          <div class="success-message" role="alert">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-width="2" stroke-linecap="round"/>
              <polyline points="22 4 12 14.01 9 11.01" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Jelszó sikeresen frissítve!</span>
            <p class="redirect-note">Átirányítás a főoldalra...</p>
          </div>
        {:else if !sessionReady}
          <div class="loading-state">
            <span class="spinner-large"></span>
            <p>Kapcsolódás...</p>
          </div>
        {:else}
          {#if error}
            <div class="error-message" role="alert">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke-width="2" stroke-linecap="round"/>
                <line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>{error}</span>
            </div>
          {/if}

          <form onsubmit={handleSubmit} class="reset-form">
            <div class="form-group">
              <label for="password" class="form-label">Új jelszó</label>
              <div class="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  bind:value={password}
                  class="form-input password-input"
                  placeholder="Minimum 6 karakter"
                  disabled={loading}
                  autocomplete="new-password"
                  required
                  minlength="6"
                />
                <button
                  type="button"
                  class="password-toggle"
                  onclick={() => showPassword = !showPassword}
                  aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
                  disabled={loading}
                >
                  {#if showPassword}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  {:else}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  {/if}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="confirmPassword" class="form-label">Jelszó megerősítése</label>
              <div class="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  bind:value={confirmPassword}
                  class="form-input password-input"
                  placeholder="Jelszó újra"
                  disabled={loading}
                  autocomplete="new-password"
                  required
                  minlength="6"
                />
                <button
                  type="button"
                  class="password-toggle"
                  onclick={() => showConfirmPassword = !showConfirmPassword}
                  aria-label={showConfirmPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
                  disabled={loading}
                >
                  {#if showConfirmPassword}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  {:else}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  {/if}
                </button>
              </div>
            </div>

            <button
              type="submit"
              class="submit-button"
              disabled={loading}
            >
              {#if loading}
                <span class="spinner"></span>
                <span>Mentés...</span>
              {:else}
                <span>Jelszó mentése</span>
              {/if}
            </button>
          </form>
        {/if}

        <div class="reset-footer">
          <button
            type="button"
            class="link-button"
            onclick={goToHome}
          >
            Vissza a főoldalra
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .reset-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-secondary);
    padding: var(--space-4);
  }

  .reset-container {
    width: 100%;
    max-width: 420px;
  }

  .reset-card {
    background: var(--bg-primary);
    border-radius: 24px;
    padding: var(--space-8);
    box-shadow:
      0 10px 40px rgba(0, 0, 0, 0.1),
      0 24px 80px rgba(0, 0, 0, 0.05);
  }

  :global([data-theme="dark"]) .reset-card {
    background: #1C1C1E;
  }

  .reset-header {
    text-align: center;
    margin-bottom: var(--space-6);
  }

  .reset-header h1 {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    margin: 0 0 var(--space-2);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .reset-subtitle {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin: 0;
  }

  .reset-content {
    color: var(--text-primary);
  }

  /* Messages */
  .error-message,
  .success-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    border-radius: 16px;
    margin-bottom: var(--space-4);
    text-align: center;
  }

  .error-message {
    background: rgba(255, 59, 48, 0.1);
    color: var(--color-error);
    border: 1px solid rgba(255, 59, 48, 0.2);
    flex-direction: row;
    text-align: left;
  }

  .error-message svg {
    flex-shrink: 0;
  }

  .success-message {
    background: rgba(52, 199, 89, 0.1);
    color: var(--color-success);
    border: 1px solid rgba(52, 199, 89, 0.2);
    padding: var(--space-6);
  }

  .success-message svg {
    flex-shrink: 0;
  }

  .redirect-note {
    font-size: var(--text-sm);
    opacity: 0.8;
    margin: 0;
  }

  /* Loading state */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-8);
    color: var(--text-secondary);
  }

  .spinner-large {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-light);
    border-top-color: var(--color-info);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  /* Form */
  .reset-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .form-label {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
  }

  .form-input {
    width: 100%;
    padding: var(--padding-input);
    border: 1px solid var(--border-light);
    border-radius: 12px;
    font-size: var(--text-base);
    font-family: var(--font-system);
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: all 200ms ease;
    box-sizing: border-box;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--color-info);
    box-shadow:
      0 0 0 3px rgba(0, 122, 255, 0.1),
      0 2px 8px rgba(0, 122, 255, 0.1);
  }

  .form-input::placeholder {
    color: var(--text-tertiary);
  }

  .form-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  :global([data-theme="dark"]) .form-input {
    background: var(--dark-bg-secondary);
    border-color: var(--dark-border);
  }

  /* Password input wrapper */
  .password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .password-input {
    padding-right: 48px;
  }

  .password-toggle {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-2);
    color: var(--text-tertiary);
    transition: all 200ms ease;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .password-toggle:hover:not(:disabled) {
    color: var(--text-secondary);
    background: var(--bg-tertiary);
  }

  .password-toggle:active:not(:disabled) {
    transform: scale(0.95);
  }

  .password-toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .password-toggle:focus-visible {
    outline: 2px solid var(--color-info);
    outline-offset: 2px;
  }

  /* Submit button */
  .submit-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    width: 100%;
    padding: 14px 20px;
    border: none;
    border-radius: 12px;
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    font-family: var(--font-system);
    cursor: pointer;
    transition: all 200ms ease;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    margin-top: var(--space-2);
  }

  .submit-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  .submit-button:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }

  .submit-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .submit-button:focus-visible {
    outline: 2px solid var(--color-info);
    outline-offset: 2px;
  }

  /* Action button */
  .action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 14px 20px;
    border: 2px solid var(--color-info);
    border-radius: 12px;
    font-size: var(--text-base);
    font-weight: var(--font-medium);
    font-family: var(--font-system);
    cursor: pointer;
    transition: all 200ms ease;
    background: rgba(0, 122, 255, 0.05);
    color: var(--color-info);
  }

  .action-button:hover {
    background: var(--color-info);
    color: white;
  }

  /* Spinner */
  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Footer */
  .reset-footer {
    text-align: center;
    margin-top: var(--space-5);
  }

  .link-button {
    background: none;
    border: none;
    color: var(--color-info);
    font-size: var(--text-sm);
    font-family: var(--font-system);
    cursor: pointer;
    padding: var(--space-2);
    transition: all 200ms ease;
  }

  .link-button:hover {
    text-decoration: underline;
  }

  .link-button:focus-visible {
    outline: 2px solid var(--color-info);
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .reset-card {
      padding: var(--space-6);
      border-radius: 20px;
    }
  }

  @media (max-width: 375px) {
    .reset-card {
      padding: var(--space-5);
      border-radius: 16px;
    }
  }
</style>

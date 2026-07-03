<script lang="ts">
	/**
	 * Authentication Modal Component
	 * Login/Register UI with email and password
	 */
	import { authStore } from '$lib/stores/auth';
	import type { AuthResult } from '$lib/api';
	import NotificationService from '$lib/services/notification.service';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onSuccess?: () => void;
	}

	let { isOpen = $bindable(false), onClose, onSuccess }: Props = $props();

	// Form state
	let mode: 'login' | 'register' | 'forgot' = $state('login');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');
	let successMessage = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);

	let dialogElement: HTMLDialogElement;
	let previousFocus: HTMLElement | null = null;
	let scrollPosition = 0;

	// Reset form when modal opens/closes
	$effect(() => {
		if (isOpen) {
			mode = 'login';
			email = '';
			password = '';
			confirmPassword = '';
			error = '';
			successMessage = '';
			showPassword = false;
			showConfirmPassword = false;
			loading = false;

			// Save current scroll position
			scrollPosition = window.scrollY || document.documentElement.scrollTop;

			// Lock body scroll
			document.body.style.overflow = 'hidden';
			document.body.style.position = 'fixed';
			document.body.style.top = `-${scrollPosition}px`;
			document.body.style.width = '100%';

			previousFocus = document.activeElement as HTMLElement;
			dialogElement?.showModal();

			// Focus first input
			setTimeout(() => {
				const emailInput = dialogElement?.querySelector<HTMLInputElement>('input[type="email"]');
				emailInput?.focus();
			}, 100);
		} else {
			// Unlock body scroll and restore position
			document.body.style.removeProperty('overflow');
			document.body.style.removeProperty('position');
			document.body.style.removeProperty('top');
			document.body.style.removeProperty('width');

			dialogElement?.close();

			// Restore scroll position
			window.scrollTo(0, scrollPosition);

			previousFocus?.focus();
		}
	});

	// Handle escape key
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			onClose();
		}
	}

	// Handle backdrop click
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === dialogElement) {
			onClose();
		}
	}

	// Validate form
	function validateForm(): boolean {
		error = '';

		if (!email || !email.includes('@')) {
			error = 'Kérjük, adj meg egy érvényes email címet.';
			return false;
		}

		if (mode !== 'forgot') {
			if (!password || password.length < 6) {
				error = 'A jelszónak legalább 6 karakter hosszúnak kell lennie.';
				return false;
			}

			if (mode === 'register' && password !== confirmPassword) {
				error = 'A jelszavak nem egyeznek.';
				return false;
			}
		}

		return true;
	}

	// Handle form submit
	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (!validateForm()) return;

		loading = true;
		error = '';
		successMessage = '';

		let result: AuthResult;

		try {
			if (mode === 'login') {
				result = await authStore.signIn(email, password);
			} else if (mode === 'register') {
				result = await authStore.signUp(email, password);
			} else {
				result = await authStore.resetPassword(email);
			}

			if (result.success) {
				if (mode === 'forgot') {
					successMessage = 'Jelszó visszaállító email elküldve!';
				} else if (result.needsEmailConfirmation) {
					successMessage = 'Regisztráció sikeres! Kérjük, erősítsd meg az email címedet.';
				} else {
					// Request notification permission after successful login/register
					await NotificationService.requestPermission();
					onSuccess?.();
					onClose();
				}
			} else {
				error = result.error || 'Ismeretlen hiba történt.';
			}
		} catch (err) {
			error = 'Váratlan hiba történt. Kérjük, próbáld újra.';
		} finally {
			loading = false;
		}
	}

	// Get title based on mode
	const title = $derived(() => {
		switch (mode) {
			case 'login':
				return 'Bejelentkezés';
			case 'register':
				return 'Regisztráció';
			case 'forgot':
				return 'Jelszó visszaállítás';
		}
	});
</script>

<dialog
	bind:this={dialogElement}
	class="auth-modal"
	onkeydown={handleKeydown}
	onclick={handleBackdropClick}
	aria-modal="true"
	aria-labelledby="auth-title"
>
	<div class="modal-content">
		<div class="modal-header">
			<h2 id="auth-title" class="modal-title">{title()}</h2>
			<button
				class="modal-close"
				onclick={onClose}
				aria-label="Bezárás"
				type="button"
			>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
				</svg>
			</button>
		</div>

		<div class="modal-body">
			{#if successMessage}
				<div class="success-message" role="alert">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-width="2" stroke-linecap="round"/>
						<polyline points="22 4 12 14.01 9 11.01" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					<span>{successMessage}</span>
				</div>
			{/if}

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

			<form onsubmit={handleSubmit} class="auth-form">
				<div class="form-group">
					<label for="email" class="form-label">Email cím</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						class="form-input"
						placeholder="pelda@email.com"
						disabled={loading}
						autocomplete="email"
						required
					/>
				</div>

				{#if mode !== 'forgot'}
					<div class="form-group">
						<label for="password" class="form-label">Jelszó</label>
						<div class="password-input-wrapper">
							<input
								type={showPassword ? 'text' : 'password'}
								id="password"
								bind:value={password}
								class="form-input password-input"
								placeholder="Minimum 6 karakter"
								disabled={loading}
								autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
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

					{#if mode === 'register'}
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
					{/if}
				{/if}

				<button
					type="submit"
					class="submit-button"
					disabled={loading}
				>
					{#if loading}
						<span class="spinner"></span>
						<span>Kérlek, várj...</span>
					{:else if mode === 'login'}
						<span>Bejelentkezés</span>
					{:else if mode === 'register'}
						<span>Regisztráció</span>
					{:else}
						<span>Email küldése</span>
					{/if}
				</button>
			</form>

			<div class="auth-footer">
				{#if mode === 'login'}
					<button
						type="button"
						class="link-button"
						onclick={() => { mode = 'forgot'; error = ''; successMessage = ''; }}
					>
						Elfelejtetted a jelszavad?
					</button>
					<button
						type="button"
						class="link-button"
						onclick={() => { mode = 'register'; error = ''; successMessage = ''; }}
					>
						Nincs még fiókod? Regisztrálj!
					</button>
				{:else if mode === 'register'}
					<button
						type="button"
						class="link-button"
						onclick={() => { mode = 'login'; error = ''; successMessage = ''; }}
					>
						Van már fiókod? Jelentkezz be!
					</button>
				{:else}
					<button
						type="button"
						class="link-button"
						onclick={() => { mode = 'login'; error = ''; successMessage = ''; }}
					>
						Vissza a bejelentkezéshez
					</button>
				{/if}
			</div>
		</div>
	</div>
</dialog>

<style>
	.auth-modal {
		border: none;
		padding: 0;
		background: transparent;
		max-width: 100vw;
		max-height: 100vh;
		width: 100%;
		overflow-x: hidden;
	}

	.auth-modal::backdrop {
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}

	.modal-content {
		background: var(--bg-primary);
		border-radius: 24px;
		padding: var(--padding-modal);
		max-height: 90vh;
		overflow-y: auto;
		width: 100%;
		max-width: 420px;
		margin: 0 auto;
		animation: modalSlideIn 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
		box-shadow:
			0 10px 40px rgba(0, 0, 0, 0.2),
			0 24px 80px rgba(0, 0, 0, 0.1);
	}

	@keyframes modalSlideIn {
		from {
			opacity: 0;
			transform: translateY(100px) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-5);
	}

	.modal-title {
		font-size: var(--text-xl);
		font-weight: var(--font-semibold);
		color: var(--text-primary);
		margin: 0;
		background: var(--brand-gradient-text);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.modal-close {
		background: none;
		border: none;
		cursor: pointer;
		padding: var(--space-2);
		color: var(--text-secondary);
		transition: all 200ms ease;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-close:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.modal-close:active {
		transform: scale(0.95);
	}

	.modal-close:focus-visible {
		outline: 2px solid var(--color-info);
		outline-offset: 2px;
	}

	.modal-body {
		color: var(--text-primary);
	}

	/* Messages */
	.error-message,
	.success-message {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		border-radius: 12px;
		margin-bottom: var(--space-4);
		font-size: var(--text-sm);
	}

	.error-message {
		background: rgba(255, 59, 48, 0.1);
		color: var(--color-error);
		border: 1px solid rgba(255, 59, 48, 0.2);
	}

	.success-message {
		background: rgba(52, 199, 89, 0.1);
		color: var(--color-success);
		border: 1px solid rgba(52, 199, 89, 0.2);
	}

	.error-message svg,
	.success-message svg {
		flex-shrink: 0;
	}

	/* Form */
	.auth-form {
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
		background: var(--brand-gradient);
		color: white;
		box-shadow: 0 4px 12px var(--brand-shadow);
		margin-top: var(--space-2);
	}

	.submit-button:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 20px var(--brand-shadow);
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
	.auth-footer {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-top: var(--space-5);
		text-align: center;
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

	/* Dark mode support */
	:global([data-theme="dark"]) .modal-content {
		background: #1C1C1E;
	}

	:global([data-theme="dark"]) .form-input {
		background: var(--dark-bg-secondary);
		border-color: var(--dark-border);
	}

	/* Responsive */
	@media (max-width: 640px) {
		.modal-content {
			max-width: calc(100vw - 24px) !important;
			padding: var(--space-4);
			border-radius: 16px;
		}

		.modal-title {
			font-size: var(--text-lg);
		}
	}
</style>

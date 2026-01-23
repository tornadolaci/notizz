<script lang="ts">
	/**
	 * Welcome Modal Component
	 * First-time user choice: Guest mode vs Login/Register
	 */

	interface Props {
		isOpen: boolean;
		onGuestMode: () => void;
		onLogin: () => void;
	}

	let { isOpen = $bindable(false), onGuestMode, onLogin }: Props = $props();

	let dialogElement: HTMLDialogElement;
	let scrollPosition = 0;

	// Handle modal open/close
	$effect(() => {
		if (isOpen) {
			// Save current scroll position
			scrollPosition = window.scrollY || document.documentElement.scrollTop;

			// Lock body scroll
			document.body.style.overflow = 'hidden';
			document.body.style.position = 'fixed';
			document.body.style.top = `-${scrollPosition}px`;
			document.body.style.width = '100%';

			dialogElement?.showModal();
		} else {
			// Unlock body scroll and restore position
			document.body.style.removeProperty('overflow');
			document.body.style.removeProperty('position');
			document.body.style.removeProperty('top');
			document.body.style.removeProperty('width');

			dialogElement?.close();

			// Restore scroll position
			window.scrollTo(0, scrollPosition);
		}
	});

	function handleGuestClick() {
		onGuestMode();
	}

	function handleLoginClick() {
		onLogin();
	}
</script>

<dialog
	bind:this={dialogElement}
	class="welcome-modal"
	aria-modal="true"
	aria-labelledby="welcome-title"
>
	<div class="modal-content">
		<!-- Logo/Brand -->
		<div class="brand">
			<h1 class="brand-title">Notizz!</h1>
			<p class="brand-subtitle">Jegyzetek és teendők egy helyen</p>
		</div>

		<!-- Welcome message -->
		<div class="welcome-message">
			<h2 id="welcome-title" class="welcome-title">Üdvözlünk!</h2>
			<p class="welcome-text">Válaszd ki, hogyan szeretnéd használni az alkalmazást:</p>
		</div>

		<!-- Options -->
		<div class="options">
			<!-- Guest Mode -->
			<button class="option-button option-button--guest" onclick={handleGuestClick}>
				<div class="option-icon">
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
					</svg>
				</div>
				<div class="option-content">
					<span class="option-title">Vendég mód</span>
					<span class="option-description">Adatok csak ezen az eszközön</span>
				</div>
				<div class="option-arrow">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M9 18l6-6-6-6" />
					</svg>
				</div>
			</button>

			<!-- Login/Register -->
			<button class="option-button option-button--login" onclick={handleLoginClick}>
				<div class="option-icon option-icon--gradient">
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
					</svg>
				</div>
				<div class="option-content">
					<span class="option-title">Bejelentkezés / Regisztráció</span>
					<span class="option-description">Szinkronizálás több eszköz között</span>
				</div>
				<div class="option-arrow">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M9 18l6-6-6-6" />
					</svg>
				</div>
			</button>
		</div>

		<!-- Info -->
		<p class="info-text">
			Vendég módban is bármikor bejelentkezhetsz a beállításokban.
		</p>
	</div>
</dialog>

<style>
	.welcome-modal {
		border: none;
		padding: 0;
		background: transparent;
		max-width: 100vw;
		max-height: 100vh;
		width: 100%;
		overflow-x: hidden;
	}

	.welcome-modal::backdrop {
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	.modal-content {
		background: var(--bg-primary);
		border-radius: 24px;
		padding: var(--space-8);
		max-height: 90vh;
		overflow-y: auto;
		width: 100%;
		max-width: 420px;
		margin: 0 auto;
		animation: modalSlideIn 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
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

	/* Brand */
	.brand {
		text-align: center;
		margin-bottom: var(--space-6);
	}

	.brand-title {
		font-size: 36px;
		font-weight: var(--font-bold);
		margin: 0;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.brand-subtitle {
		font-size: var(--text-sm);
		color: var(--text-tertiary);
		margin: var(--space-2) 0 0;
	}

	/* Welcome message */
	.welcome-message {
		text-align: center;
		margin-bottom: var(--space-6);
	}

	.welcome-title {
		font-size: var(--text-xl);
		font-weight: var(--font-semibold);
		color: var(--text-primary);
		margin: 0 0 var(--space-2);
	}

	.welcome-text {
		font-size: var(--text-base);
		color: var(--text-secondary);
		margin: 0;
	}

	/* Options */
	.options {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin-bottom: var(--space-5);
	}

	.option-button {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-4);
		background: var(--bg-secondary);
		border: 2px solid var(--border-light);
		border-radius: 16px;
		cursor: pointer;
		transition: all 200ms ease;
		text-align: left;
		width: 100%;
	}

	.option-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.option-button:active {
		transform: translateY(0) scale(0.98);
	}

	.option-button--guest:hover {
		border-color: var(--text-tertiary);
		background: var(--bg-tertiary);
	}

	.option-button--login {
		border-color: rgba(102, 126, 234, 0.3);
		background: rgba(102, 126, 234, 0.05);
	}

	.option-button--login:hover {
		border-color: rgba(102, 126, 234, 0.5);
		background: rgba(102, 126, 234, 0.1);
	}

	.option-icon {
		width: 56px;
		height: 56px;
		border-radius: 14px;
		background: var(--bg-tertiary);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	.option-icon--gradient {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.option-content {
		flex: 1;
		min-width: 0;
	}

	.option-title {
		display: block;
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		color: var(--text-primary);
		margin-bottom: var(--space-1);
	}

	.option-description {
		display: block;
		font-size: var(--text-sm);
		color: var(--text-tertiary);
	}

	.option-arrow {
		color: var(--text-tertiary);
		flex-shrink: 0;
	}

	/* Info text */
	.info-text {
		font-size: var(--text-sm);
		color: var(--text-tertiary);
		text-align: center;
		margin: 0;
		padding: var(--space-3);
		background: var(--bg-secondary);
		border-radius: 8px;
	}

	/* Dark mode */
	:global([data-theme="dark"]) .modal-content {
		background: #1C1C1E;
	}

	:global([data-theme="dark"]) .option-button {
		background: var(--dark-bg-secondary);
		border-color: var(--dark-border);
	}

	:global([data-theme="dark"]) .option-button--guest:hover {
		background: var(--dark-bg-tertiary);
	}

	:global([data-theme="dark"]) .option-button--login {
		background: rgba(102, 126, 234, 0.1);
		border-color: rgba(102, 126, 234, 0.3);
	}

	:global([data-theme="dark"]) .option-button--login:hover {
		background: rgba(102, 126, 234, 0.15);
	}

	:global([data-theme="dark"]) .option-icon {
		background: var(--dark-bg-tertiary);
	}

	:global([data-theme="dark"]) .info-text {
		background: var(--dark-bg-secondary);
	}

	/* Responsive */
	@media (max-width: 640px) {
		.modal-content {
			max-width: calc(100vw - 24px) !important;
			padding: var(--space-6);
			border-radius: 20px;
		}

		.brand-title {
			font-size: 28px;
		}

		.option-icon {
			width: 48px;
			height: 48px;
		}

		.option-icon svg {
			width: 24px;
			height: 24px;
		}
	}

	@media (max-width: 375px) {
		.modal-content {
			padding: var(--space-5);
			border-radius: 16px;
		}

		.brand-title {
			font-size: 24px;
		}

		.option-button {
			padding: var(--space-3);
			gap: var(--space-3);
		}

		.option-icon {
			width: 44px;
			height: 44px;
			border-radius: 12px;
		}

		.option-title {
			font-size: var(--text-sm);
		}

		.option-description {
			font-size: 12px;
		}
	}
</style>

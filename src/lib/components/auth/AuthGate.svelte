<script lang="ts">
	/**
	 * Auth Gate Component
	 * Full-page welcome screen shown when the user is not authenticated.
	 * The app is login-only.
	 */

	import NotificationService from '$lib/services/notification.service';

	interface Props {
		onLogin: () => void;
	}

	let { onLogin }: Props = $props();

	async function handleLoginClick() {
		// Request notification permission
		await NotificationService.requestPermission();
		onLogin();
	}
</script>

<div class="auth-gate">
	<div class="gate-card">
		<!-- Logo/Brand -->
		<div class="brand">
			<h1 class="brand-title">Notizz!</h1>
		</div>

		<!-- Welcome message -->
		<div class="welcome-message">
			<p class="welcome-text">
				Jegyzetek és teendők, minden eszközödön szinkronizálva.
			</p>
			<p class="welcome-subtext">
				A használathoz jelentkezz be vagy regisztrálj.
			</p>
		</div>

		<!-- Login/Register -->
		<button class="login-button" onclick={handleLoginClick}>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
			</svg>
			<span>Bejelentkezés / Regisztráció</span>
		</button>
	</div>
</div>

<style>
	.auth-gate {
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		background: var(--bg-secondary);
	}

	.gate-card {
		width: 100%;
		max-width: 420px;
		background: var(--bg-primary);
		border-radius: 24px;
		padding: var(--space-8);
		text-align: center;
		box-shadow:
			0 10px 40px rgba(0, 0, 0, 0.1),
			0 24px 80px rgba(0, 0, 0, 0.05);
	}

	:global([data-theme="dark"]) .gate-card {
		background: #1C1C1E;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.brand {
		margin-bottom: var(--space-5);
	}

	.brand-title {
		font-size: 40px;
		font-weight: var(--font-bold);
		margin: 0;
		background: var(--brand-gradient-text);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.welcome-message {
		margin-bottom: var(--space-6);
	}

	.welcome-text {
		font-size: var(--text-base);
		color: var(--text-primary);
		margin: 0 0 var(--space-2);
	}

	.welcome-subtext {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		margin: 0;
	}

	.login-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		width: 100%;
		min-height: 44px;
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
	}

	.login-button:hover {
		transform: translateY(-1px);
		box-shadow: 0 6px 20px var(--brand-shadow);
	}

	.login-button:active {
		transform: translateY(0) scale(0.98);
	}

	.login-button:focus-visible {
		outline: 2px solid var(--color-info);
		outline-offset: 2px;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.gate-card {
			padding: var(--space-6);
			border-radius: 20px;
		}
	}

	@media (max-width: 375px) {
		.gate-card {
			padding: var(--space-5);
			border-radius: 16px;
		}
	}
</style>

<script lang="ts">
	interface Props {
		message: string;
		visible: boolean;
		onClose?: () => void;
	}

	let { message = '', visible = $bindable(false), onClose }: Props = $props();

	let dialogElement: HTMLDialogElement;
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	// Auto-hide after 5 seconds and manage dialog open/close
	$effect(() => {
		if (visible) {
			if (timeoutId) clearTimeout(timeoutId);

			// Show dialog as modal to appear in top layer
			dialogElement?.showModal();

			timeoutId = setTimeout(() => {
				visible = false;
				if (onClose) onClose();
			}, 5000);
		} else {
			// Close dialog
			dialogElement?.close();
		}

		return () => {
			if (timeoutId) clearTimeout(timeoutId);
		};
	});
</script>

<!-- Use native dialog element to appear in top layer above other modals -->
<dialog bind:this={dialogElement} class="toast-dialog" aria-live="polite">
	<div class="toast">
		<p class="toast__message">{message}</p>
	</div>
</dialog>

<style>
	/* Dialog wrapper - transparent, positioned at top center, no backdrop */
	.toast-dialog {
		position: fixed;
		top: var(--space-3);
		left: 0;
		right: 0;
		margin: 0 auto;

		border: none;
		padding: 0;
		background: transparent;
		overflow: visible;
		width: fit-content;
		max-width: 90%;

		/* Ensure it appears above other dialogs in top layer */
		z-index: 2147483647;
	}

	/* Remove default dialog backdrop */
	.toast-dialog::backdrop {
		background: transparent;
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
	}

	/* Actual toast content */
	.toast {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);

		border: 1px solid rgba(255, 149, 0, 0.3);
		border-radius: 12px;
		box-shadow:
			0 2px 8px rgba(255, 149, 0, 0.2),
			0 4px 16px rgba(0, 0, 0, 0.1);

		padding: var(--space-3) var(--space-4);
		width: auto;
		min-width: 280px;

		animation: slideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.toast__message {
		margin: 0;
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		color: #ff9500;
		text-align: center;
		line-height: 1.4;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Dark mode */
	:global([data-theme='dark']) .toast {
		background: rgba(28, 28, 30, 0.95);
		border-color: rgba(255, 149, 0, 0.4);
	}

	/* Mobile adjustments */
	@media (max-width: 640px) {
		.toast-dialog {
			top: var(--space-2);
		}

		.toast {
			min-width: 240px;
			padding: var(--space-2) var(--space-3);
		}

		.toast__message {
			font-size: var(--text-sm);
		}
	}
</style>

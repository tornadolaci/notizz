<script lang="ts">
	/**
	 * Modal Component
	 * General-purpose modal wrapper with backdrop, focus trap and keyboard navigation
	 */
	import { onMount } from 'svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		title?: string;
		maxWidth?: string;
	}

	let { isOpen = $bindable(false), onClose, title, maxWidth = '600px' }: Props = $props();

	let dialogElement: HTMLDialogElement;
	let previousFocus: HTMLElement | null = null;
	let scrollPosition = 0;

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

	// Focus management and scroll lock
	$effect(() => {
		if (isOpen) {
			// Save current scroll position
			scrollPosition = window.scrollY || document.documentElement.scrollTop;

			// Lock body scroll
			document.body.style.overflow = 'hidden';
			document.body.style.position = 'fixed';
			document.body.style.top = `-${scrollPosition}px`;
			document.body.style.width = '100%';

			previousFocus = document.activeElement as HTMLElement;
			dialogElement?.showModal();

			// Focus first focusable element in modal
			const firstFocusable = dialogElement?.querySelector<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			firstFocusable?.focus();
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

	onMount(() => {
		return () => {
			if (previousFocus) {
				previousFocus.focus();
			}
		};
	});
</script>

<dialog
	bind:this={dialogElement}
	class="modal"
	onkeydown={handleKeydown}
	onclick={handleBackdropClick}
	aria-modal="true"
	aria-labelledby={title ? 'modal-title' : undefined}
>
	<div class="modal-content" style="max-width: {maxWidth}">
		<div class="modal-header">
			{#if title}
				<h2 id="modal-title" class="modal-title">{title}</h2>
			{/if}
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
			<slot />
		</div>
	</div>
</dialog>

<style>
	.modal {
		border: none;
		padding: 0;
		background: transparent;
		max-width: 100vw;
		max-height: 100vh;
		width: 100%;
		overflow-x: hidden;
	}

	.modal::backdrop {
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}

	.modal-content {
		background: var(--bg-primary);
		border-radius: 24px;
		padding: var(--padding-modal);
		max-height: 85vh;
		overflow-y: auto;
		width: 100%;
		max-width: calc(100vw - 32px);
		box-sizing: border-box;
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

	/* Smooth scrolling */
	.modal-content {
		-webkit-overflow-scrolling: touch;
	}

	/* Dark mode support */
	:global([data-theme="dark"]) .modal-content {
		background: #293F3F;
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

		.modal-header {
			margin-bottom: var(--space-4);
		}
	}
</style>

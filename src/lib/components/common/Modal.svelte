<script lang="ts">
	/**
	 * Modal Component
	 * General-purpose modal wrapper with backdrop, focus trap and keyboard navigation
	 */
	import { onMount } from 'svelte';

	import type { Snippet } from 'svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		title?: string;
		subtitle?: string;
		maxWidth?: string;
		/** Solid dark tint (hex) derived from the edited card's color; drives the panel background */
		bgColor?: string | null;
		children: Snippet;
	}

	let { isOpen = $bindable(false), onClose, title, subtitle, maxWidth = '600px', bgColor = null, children }: Props = $props();

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
	<div
		class="modal-content"
		class:modal-content--tinted={bgColor}
		style="max-width: {maxWidth}{bgColor ? `; --modal-bg: ${bgColor}` : ''}"
	>
		<div class="modal-header">
			{#if title}
				<div class="modal-heading">
					<h2 id="modal-title" class="modal-title">{title}</h2>
					{#if subtitle}
						<p class="modal-subtitle">{subtitle}</p>
					{/if}
				</div>
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
			{@render children()}
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

		/* Position modal at top center of screen */
		/* Toast notifications appear above in top layer with higher z-index */
		position: fixed;
		top: var(--space-6);
		left: 0;
		right: 0;
		margin: 0 auto;
	}

	.modal::backdrop {
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}

	.modal-content {
		background: rgba(255, 255, 255, 0.80);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-radius: 28px;
		padding: var(--padding-modal);
		padding-top: 60px; /* Extra top padding for close button clearance */
		max-height: calc(100vh - var(--space-8) - var(--space-6));
		max-height: calc(100dvh - var(--space-8) - var(--space-6));
		overflow-y: auto;
		width: 100%;
		max-width: calc(100vw - 32px);
		box-sizing: border-box;
		margin: 0 auto;
		animation: modalSlideIn 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
		box-shadow:
			0 10px 40px rgba(0, 0, 0, 0.2),
			0 24px 80px rgba(0, 0, 0, 0.1);
		position: relative; /* Position context for close button */
	}

	/* Tinted panel - shade derived from the edited card's color.
	   LIGHT theme: light-to-mid tint (fehérrel hígítva), dark text.
	   DARK theme (below): keeps the deep --modal-bg shade with light text. */
	.modal-content--tinted {
		background: linear-gradient(160deg,
			color-mix(in srgb, var(--modal-bg) 45%, #FFFFFF) 0%,
			color-mix(in srgb, var(--modal-bg) 62%, #FFFFFF) 55%);
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
		border: 1px solid rgba(255, 255, 255, 0.10);
	}

	.modal-content--tinted .modal-title {
		color: var(--text-primary);
	}

	.modal-content--tinted .modal-subtitle {
		color: var(--text-secondary);
	}

	.modal-content--tinted .modal-close {
		background: rgba(255, 255, 255, 0.55);
		color: #4B4E5E;
		border: 1px solid rgba(0, 0, 0, 0.06);
	}

	.modal-content--tinted .modal-close:hover {
		background: rgba(255, 59, 48, 0.14);
		border-color: transparent;
		color: var(--color-error);
	}

	/* DARK theme: ignore the card-color tint entirely and restore the ORIGINAL
	   (pre-redesign) AMOLED panel + red-ringed close button. The tint only
	   applies in light mode. */
	:global([data-theme="dark"]) .modal-content--tinted {
		background: rgba(20, 24, 38, 0.92);
		border: 1px solid rgba(255, 255, 255, 0.10);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
	}

	:global([data-theme="dark"]) .modal-content--tinted .modal-title {
		color: #FFFFFF;
	}

	:global([data-theme="dark"]) .modal-content--tinted .modal-subtitle {
		color: rgba(255, 255, 255, 0.65);
	}

	/* Original dark close button: dark square, red outline + red glow, white X. */
	:global([data-theme="dark"]) .modal-content--tinted .modal-close {
		background: #151A2A;
		color: #F2F3F7;
		border: none;
		border-radius: 16px;
		outline: 2px solid #FF3B30;
		box-shadow: 0 0 12px rgba(255, 59, 48, 0.4);
	}

	:global([data-theme="dark"]) .modal-content--tinted .modal-close:hover {
		background: #1B2134;
		border-color: transparent;
		color: #FFFFFF;
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
		align-items: flex-start;
		margin-bottom: var(--space-5);
		position: static; /* Changed from relative to prevent button from moving with scroll */
		padding-right: 52px; /* Space for close button (44px width + 8px margin) */
	}

	.modal-heading {
		flex: 1;
		min-width: 0;
	}

	.modal-title {
		font-size: var(--text-xl);
		font-weight: var(--font-semibold);
		color: var(--text-primary);
		margin: 0;
		overflow-wrap: break-word;
	}

	.modal-subtitle {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--text-tertiary);
		margin: var(--space-1) 0 0;
	}

	.modal-close {
		background: var(--surface-2);
		cursor: pointer;
		padding: var(--space-1);
		color: var(--text-secondary);
		transition: all 200ms ease;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		position: absolute;
		top: 12px; /* Fixed position from top of modal-content */
		right: 12px; /* Fixed position from right of modal-content */
		width: 44px;
		height: 44px;
		border: none;
		z-index: 10; /* Above scrolling content */
	}

	.modal-close svg {
		width: 20px;
		height: 20px;
	}

	/* Soft neutral at rest, red intent only on hover */
	.modal-close:hover {
		background: rgba(255, 59, 48, 0.12);
		color: var(--color-error);
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

	/* LIGHT theme tinted panel is a light-to-mid shade -> body labels stay dark. */
	.modal-content--tinted .modal-body {
		--text-primary: #1B1C22;
		--text-secondary: #4B4E5E;
		--text-tertiary: #8C8FA1;
		/* Keep single-line inputs light with dark text, regardless of theme */
		--surface-2: #FFFFFF;
		--border-light: rgba(0, 0, 0, 0.08);
		color: var(--text-primary);
	}

	/* DARK theme tinted panel is a deep shade -> body labels go light. */
	:global([data-theme="dark"]) .modal-content--tinted .modal-body {
		--text-primary: #F4F5F8;
		--text-secondary: rgba(255, 255, 255, 0.80);
		--text-tertiary: rgba(255, 255, 255, 0.55);
	}

	/* Pastel content boxes are ALWAYS light, so text inside them stays dark
	   in both themes (overrides the dark-theme label remap above). */
	.modal-content--tinted .modal-body :global(.textarea-wrapper),
	.modal-content--tinted .modal-body :global(.items-list) {
		--text-primary: #1B1C22;
		--text-secondary: #4B4E5E;
		--text-tertiary: #8C8FA1;
		color: #1B1C22;
	}

	/* Single-line inputs: solid white with dark text on the tinted panel even
	   in dark theme (editors flip .input to an AMOLED surface otherwise).
	   NOTE: .textarea is intentionally excluded so the note keeps its pastel
	   gradient background from .textarea-wrapper. */
	.modal-content--tinted .modal-body :global(.input) {
		background: #FFFFFF;
		color: #1B1C22;
		border-color: rgba(0, 0, 0, 0.08);
	}

	.modal-content--tinted .modal-body :global(.input::placeholder) {
		color: #A3A6B6;
	}

	/* Pastel content boxes (note textarea wrapper, todo items list) keep their
	   light gradient on the tinted panel in BOTH themes, so they read as light
	   cards floating on the mid-tone panel (editors darken them in dark mode). */
	.modal-content--tinted .modal-body :global(.textarea-wrapper),
	.modal-content--tinted .modal-body :global(.items-list) {
		background: linear-gradient(145deg, var(--textarea-bg, var(--items-list-bg, #F7F8FC)) 0%, #FFFFFF 120%) !important;
		border: 1px solid rgba(0, 0, 0, 0.06);
	}

	.modal-content--tinted .modal-body :global(.textarea-wrapper)::before,
	.modal-content--tinted .modal-body :global(.items-list)::before {
		opacity: 0.55;
		background: radial-gradient(
			circle at 15% 10%,
			var(--textarea-bg, var(--items-list-bg, rgba(247, 248, 252, 0.5))) 0%,
			#FFFFFF 70%
		);
	}

	/* DARK theme: undo all the light-content overrides above so the editors'
	   own original AMOLED styling (dark boxes, aura, white text) takes over.
	   The light-mode look is unchanged. */
	:global([data-theme="dark"]) .modal-content--tinted .modal-body {
		--surface-2: var(--amoled-surface-2);
		--border-light: var(--amoled-border);
	}

	:global([data-theme="dark"]) .modal-content--tinted .modal-body :global(.textarea-wrapper),
	:global([data-theme="dark"]) .modal-content--tinted .modal-body :global(.items-list) {
		--text-primary: var(--amoled-text-primary);
		--text-secondary: var(--amoled-text-secondary);
		--text-tertiary: var(--amoled-text-tertiary);
		color: var(--amoled-text-primary);
		background: var(--amoled-surface-1) !important;
		border: 1px solid var(--amoled-border);
	}

	:global([data-theme="dark"]) .modal-content--tinted .modal-body :global(.textarea-wrapper)::before,
	:global([data-theme="dark"]) .modal-content--tinted .modal-body :global(.items-list)::before {
		opacity: 1;
		background: radial-gradient(
			circle at 15% 10%,
			var(--card-tint, rgba(255, 255, 255, 0.10)) 0%,
			transparent 55%
		);
	}

	:global([data-theme="dark"]) .modal-content--tinted .modal-body :global(.input) {
		background: var(--amoled-surface-2);
		color: var(--amoled-text-primary);
		border-color: var(--amoled-border);
	}

	/* Smooth scrolling */
	.modal-content {
		-webkit-overflow-scrolling: touch;
	}

	/* Dark mode support - AMOLED Glass */
	:global([data-theme="dark"]) .modal::backdrop {
		background: rgba(0, 0, 0, 0.60);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
	}

	:global([data-theme="dark"]) .modal-content:not(.modal-content--tinted) {
		background: rgba(20, 24, 38, 0.92);
		border: 1px solid rgba(255, 255, 255, 0.10);
		color: var(--amoled-text-primary);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
	}

	/* Dark mode - soft neutral close button (red intent only on hover) */
	:global([data-theme="dark"]) .modal-content:not(.modal-content--tinted) .modal-close {
		background: var(--amoled-surface-2);
		color: var(--amoled-text-secondary);
		border: 1px solid var(--amoled-border);
	}

	:global([data-theme="dark"]) .modal-content:not(.modal-content--tinted) .modal-close:hover {
		background: rgba(255, 59, 48, 0.18);
		border-color: rgba(255, 59, 48, 0.4);
		color: var(--color-error);
	}

	/* Responsive */
	@media (max-width: 640px) {
		.modal {
			top: var(--space-4);
		}

		.modal-content {
			max-width: calc(100vw - 16px) !important;
			max-height: calc(100vh - var(--space-6) - var(--space-4)) !important;
			max-height: calc(100dvh - var(--space-6) - var(--space-4)) !important;
			padding: var(--space-3) var(--space-4);
			padding-top: 56px; /* Extra top padding for close button on mobile */
			border-radius: 16px;
		}

		.modal-title {
			font-size: var(--text-lg);
		}

		.modal-header {
			margin-bottom: var(--space-3);
		}
	}
</style>

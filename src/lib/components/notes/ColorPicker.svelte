<script lang="ts">
	/**
	 * ColorPicker Component
	 * Allows users to select from predefined pastel colors
	 */
	import { PASTEL_COLORS, PASTEL_COLOR_NAMES, type PastelColorKey } from '$lib/constants/colors';

	interface Props {
		selectedColor: PastelColorKey;
		onSelect: (color: PastelColorKey) => void;
	}

	let { selectedColor = $bindable(), onSelect }: Props = $props();

	const colorEntries = Object.entries(PASTEL_COLORS) as [PastelColorKey, string][];

	function handleColorSelect(color: PastelColorKey) {
		onSelect(color);
	}

	function handleKeydown(e: KeyboardEvent, color: PastelColorKey) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleColorSelect(color);
		}
	}
</script>

<div class="color-picker" role="radiogroup" aria-label="Színválasztó">
	{#each colorEntries as [colorKey, colorValue]}
		<button
			type="button"
			class="color-option"
			class:selected={selectedColor === colorKey}
			style="background-color: {colorValue}"
			onclick={() => handleColorSelect(colorKey)}
			onkeydown={(e) => handleKeydown(e, colorKey)}
			role="radio"
			aria-checked={selectedColor === colorKey}
			aria-label={PASTEL_COLOR_NAMES[colorKey]}
			title={PASTEL_COLOR_NAMES[colorKey]}
		>
			{#if selectedColor === colorKey}
				<svg
					class="checkmark"
					width="20"
					height="20"
					viewBox="0 0 20 20"
					fill="none"
				>
					<path
						d="M16.5 6L7.5 15L3.5 11"
						stroke="white"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			{/if}
		</button>
	{/each}
</div>

<style>
	.color-picker {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.color-option {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition: all 200ms ease;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.color-option:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.color-option:active {
		transform: scale(0.95);
	}

	.color-option:focus-visible {
		outline: 2px solid var(--color-info);
		outline-offset: 2px;
	}

	.color-option.selected {
		transform: scale(1.15);
		border-color: rgba(0, 0, 0, 0.2);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.color-option.selected:hover {
		transform: scale(1.2);
	}

	.checkmark {
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
		animation: checkmarkAppear 200ms ease;
	}

	@keyframes checkmarkAppear {
		0% {
			opacity: 0;
			transform: scale(0);
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* Touch-friendly sizing */
	@media (hover: none), (pointer: coarse) {
		.color-option {
			width: 48px;
			height: 48px;
		}
	}
</style>

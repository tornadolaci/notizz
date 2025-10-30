<script lang="ts">
	/**
	 * TagInput Component
	 * Allows users to add and remove tags with keyboard support
	 */
	interface Props {
		tags: string[];
		onTagsChange: (tags: string[]) => void;
		placeholder?: string;
	}

	let { tags = $bindable([]), onTagsChange, placeholder = 'Címkék hozzáadása...' }: Props = $props();

	let inputValue = $state('');
	let inputElement: HTMLInputElement;

	function addTag() {
		const trimmedValue = inputValue.trim();
		if (trimmedValue && !tags.includes(trimmedValue)) {
			const newTags = [...tags, trimmedValue];
			onTagsChange(newTags);
			inputValue = '';
		}
	}

	function removeTag(tagToRemove: string) {
		const newTags = tags.filter((tag) => tag !== tagToRemove);
		onTagsChange(newTags);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addTag();
		} else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
			// Remove last tag when backspace is pressed on empty input
			removeTag(tags[tags.length - 1]);
		}
	}

	function handleTagKeydown(e: KeyboardEvent, tag: string) {
		if (e.key === 'Enter' || e.key === 'Delete' || e.key === 'Backspace') {
			e.preventDefault();
			removeTag(tag);
			inputElement?.focus();
		}
	}
</script>

<div class="tag-input-container">
	<div class="tag-list">
		{#each tags as tag (tag)}
			<span
				class="tag"
				role="button"
				tabindex="0"
				onkeydown={(e) => handleTagKeydown(e, tag)}
				aria-label={`${tag} címke eltávolítása`}
			>
				<span class="tag-text">{tag}</span>
				<button
					type="button"
					class="tag-remove"
					onclick={() => removeTag(tag)}
					aria-label={`${tag} eltávolítása`}
				>
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor">
						<path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke-width="1.5" stroke-linecap="round"/>
					</svg>
				</button>
			</span>
		{/each}
		<input
			bind:this={inputElement}
			bind:value={inputValue}
			type="text"
			class="tag-input"
			{placeholder}
			onkeydown={handleKeydown}
			aria-label="Címke hozzáadása"
		/>
	</div>
</div>

<style>
	.tag-input-container {
		width: 100%;
	}

	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		padding: var(--padding-input);
		border: 1px solid var(--border-light);
		border-radius: 12px;
		background: var(--bg-primary);
		min-height: 48px;
		align-items: center;
		transition: all 200ms ease;
	}

	.tag-list:focus-within {
		outline: none;
		border-color: var(--color-info);
		box-shadow:
			0 0 0 3px rgba(0, 122, 255, 0.1),
			0 2px 8px rgba(0, 122, 255, 0.1);
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) var(--space-2);
		background: var(--bg-tertiary);
		border-radius: 6px;
		font-size: var(--text-sm);
		color: var(--text-primary);
		cursor: default;
		transition: all 200ms ease;
		animation: tagSlideIn 200ms ease;
	}

	@keyframes tagSlideIn {
		from {
			opacity: 0;
			transform: scale(0.8);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.tag:focus {
		outline: 2px solid var(--color-info);
		outline-offset: 1px;
	}

	.tag-text {
		user-select: none;
	}

	.tag-remove {
		background: none;
		border: none;
		cursor: pointer;
		padding: 2px;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 150ms ease;
	}

	.tag-remove:hover {
		color: var(--color-error);
		background: rgba(255, 59, 48, 0.1);
	}

	.tag-remove:active {
		transform: scale(0.9);
	}

	.tag-input {
		flex: 1;
		min-width: 120px;
		border: none;
		outline: none;
		background: transparent;
		font-size: var(--text-base);
		color: var(--text-primary);
		padding: 4px;
	}

	.tag-input::placeholder {
		color: var(--text-tertiary);
	}

	/* Dark mode */
	:global([data-theme="dark"]) .tag {
		background: var(--dark-bg-tertiary);
	}

	/* Responsive */
	@media (max-width: 640px) {
		.tag-input {
			min-width: 100px;
		}
	}
</style>

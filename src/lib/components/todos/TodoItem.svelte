<script lang="ts">
	/**
	 * TodoItem Component
	 * Individual todo item with checkbox, text, and delete button
	 */
	import type { ITodoItem } from '$lib/types/todo';

	interface Props {
		item: ITodoItem;
		onToggle: (id: string) => void;
		onDelete: (id: string) => void;
		editable?: boolean;
	}

	let { item, onToggle, onDelete, editable = true }: Props = $props();

	function handleCheckboxChange() {
		onToggle(item.id);
	}

	function handleDelete(e: MouseEvent) {
		e.stopPropagation();
		onDelete(item.id);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleCheckboxChange();
		}
	}
</script>

<div
	class="todo-item"
	class:completed={item.completed}
	role="button"
	tabindex="0"
	onclick={handleCheckboxChange}
	onkeydown={handleKeydown}
	aria-label={item.completed ? `${item.text} - befejezve` : item.text}
>
	<div class="checkbox-wrapper">
		<div
			class="checkbox"
			class:checked={item.completed}
			role="checkbox"
			aria-checked={item.completed}
		>
			{#if item.completed}
				<svg class="checkmark" width="16" height="16" viewBox="0 0 16 16" fill="none">
					<path
						d="M13 4L6 11L3 8"
						stroke="white"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			{/if}
		</div>
	</div>

	<span class="todo-text">{item.text}</span>

	{#if editable}
		<button
			type="button"
			class="delete-button"
			onclick={handleDelete}
			aria-label={`${item.text} törlése`}
			title="Törlés"
		>
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
				<path d="M12 4L4 12M4 4l8 8" stroke-width="2" stroke-linecap="round"/>
			</svg>
		</button>
	{/if}
</div>

<style>
	.todo-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		border-radius: 8px;
		cursor: pointer;
		transition: all 200ms ease;
		user-select: none;
		position: relative;
		background: transparent;
	}

	.todo-item:hover {
		background: rgba(0, 0, 0, 0.03);
	}

	.todo-item:active {
		transform: scale(0.98);
	}

	.todo-item:focus {
		outline: 2px solid var(--color-info);
		outline-offset: -2px;
	}

	.todo-item.completed {
		opacity: 0.6;
	}

	.checkbox-wrapper {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.checkbox {
		width: 24px;
		height: 24px;
		border: 2px solid var(--border-medium);
		border-radius: 6px;
		position: relative;
		transition: all 200ms ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.checkbox:hover {
		border-color: var(--color-info);
	}

	.checkbox.checked {
		background: var(--color-success);
		border-color: var(--color-success);
	}

	.checkmark {
		animation: checkmarkPop 200ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
	}

	@keyframes checkmarkPop {
		0% {
			transform: scale(0) rotate(-45deg);
		}
		50% {
			transform: scale(1.2) rotate(10deg);
		}
		100% {
			transform: scale(1) rotate(0);
		}
	}

	.todo-text {
		flex: 1;
		font-size: var(--text-base);
		color: var(--text-primary);
		line-height: var(--leading-normal);
		transition: all 200ms ease;
		word-break: break-word;
	}

	.todo-item.completed .todo-text {
		text-decoration: line-through;
		color: var(--text-tertiary);
	}

	.delete-button {
		background: none;
		border: none;
		cursor: pointer;
		padding: var(--space-1);
		color: var(--text-tertiary);
		transition: all 200ms ease;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		flex-shrink: 0;
	}

	.todo-item:hover .delete-button {
		opacity: 1;
	}

	.delete-button:hover {
		background: rgba(255, 59, 48, 0.1);
		color: var(--color-error);
	}

	.delete-button:active {
		transform: scale(0.9);
	}

	.delete-button:focus-visible {
		opacity: 1;
		outline: 2px solid var(--color-error);
		outline-offset: 2px;
	}

	/* Dark mode */
	:global([data-theme="dark"]) .todo-item:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	/* Touch devices - always show delete button */
	@media (hover: none), (pointer: coarse) {
		.delete-button {
			opacity: 1;
		}
	}
</style>

<script lang="ts">
	/**
	 * TodoEditor Component
	 * Modal form for creating and editing todos with items
	 */
	import { todosStore, todosValue } from '$lib/stores/todos';
	import type { ITodo, ITodoItem } from '$lib/types/todo';
	import { DEFAULT_TODO_COLOR, PASTEL_COLORS, hexToColorKey, getDarkTint, getGlowColor, type PastelColorKey } from '$lib/constants/colors';
	import Modal from '$lib/components/common/Modal.svelte';
	import ColorPicker from '$lib/components/notes/ColorPicker.svelte';
	import TodoItem from './TodoItem.svelte';
	import { generateId } from '$lib/utils/uuid';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		todo?: ITodo | null;
	}

	let { isOpen = $bindable(false), onClose, todo = null }: Props = $props();

	// Form state
	let title = $state('');
	let items = $state<ITodoItem[]>([]);
	let selectedColor = $state<PastelColorKey>(DEFAULT_TODO_COLOR);
	let isSaving = $state(false);

	// New item input
	let newItemText = $state('');

	// Dark mode dynamic colors for aura effect
	const cardTint = $derived(todo?.color ? getDarkTint(todo.color) : null);
	const cardGlow = $derived(todo?.color ? getGlowColor(todo.color) : null);

	// Populate form when editing existing todo
	$effect(() => {
		if (isOpen) {
			if (todo) {
				title = todo.title;
				items = [...todo.items];
				selectedColor = hexToColorKey(todo.color);
			} else {
				// Reset form for new todo - use default todo color (mint)
				title = '';
				items = [];
				selectedColor = DEFAULT_TODO_COLOR;
			}
			newItemText = '';
		}
	});

	// Reactive sync - update local state when store changes (for realtime/polling updates)
	// This enables live updates while the editor is open (e.g., when shopping from multiple devices)
	// IMPORTANT: Must use $todosValue (reactive derived store) instead of todosStore.getById()
	// because getById() uses get() which is NOT reactive in Svelte 5 $effect
	$effect(() => {
		if (isOpen && todo?.id) {
			// Only sync for existing todos (edit mode), not for new todos
			// Access $todosValue to create reactive dependency on store changes
			const allTodos = $todosValue;
			const latestTodo = allTodos.find(t => t.id === todo.id);
			if (latestTodo) {
				// Update local state with fresh data from store
				items = [...latestTodo.items];
				title = latestTodo.title;
				// Don't update selectedColor - user might be changing it
			}
		}
	});

	async function addItem() {
		const trimmedText = newItemText.trim();
		if (trimmedText) {
			const newItem: ITodoItem = {
				id: generateId(),
				text: trimmedText,
				completed: false,
				createdAt: new Date()
			};

			// 1. Lokális UI frissítés (optimistic update)
			items = [...items, newItem];
			newItemText = '';

			// 2. Ha van mentett TODO (szerkesztés mód), azonnal DB mentés
			if (todo?.id) {
				try {
					const completedCount = items.filter((item) => item.completed).length;
					await todosStore.update(todo.id, {
						items,
						completedCount,
						totalCount: items.length,
						updatedAt: new Date()
					});
				} catch (error) {
					console.error('Failed to save new item:', error);
				}
			}
			// Új TODO esetén marad a régi működés (mentés gombbal)
		}
	}

	function handleItemKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addItem();
		}
	}

	async function toggleItem(id: string) {
		// 1. Lokális UI frissítés (optimistic update)
		items = items.map((item) =>
			item.id === id ? { ...item, completed: !item.completed } : item
		);

		// 2. Ha van mentett TODO (szerkesztés mód), azonnal DB mentés
		if (todo?.id) {
			try {
				await todosStore.toggleItem(todo.id, id);
			} catch (error) {
				console.error('Failed to save checkbox state:', error);
			}
		}
		// Új TODO esetén marad a régi működés (mentés gombbal)
	}

	async function deleteItem(id: string) {
		// 1. Lokális UI frissítés (optimistic update)
		items = items.filter((item) => item.id !== id);

		// 2. Ha van mentett TODO (szerkesztés mód), azonnal DB mentés
		if (todo?.id) {
			try {
				const completedCount = items.filter((item) => item.completed).length;
				await todosStore.update(todo.id, {
					items,
					completedCount,
					totalCount: items.length,
					updatedAt: new Date()
				});
			} catch (error) {
				console.error('Failed to delete item:', error);
			}
		}
		// Új TODO esetén marad a régi működés (mentés gombbal)
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (!title.trim()) {
			alert('A cím megadása kötelező!');
			return;
		}

		if (items.length === 0) {
			alert('Legalább egy teendő megadása kötelező!');
			return;
		}

		isSaving = true;

		try {
			// Convert color key to HEX value
			const colorHex = PASTEL_COLORS[selectedColor];
			const completedCount = items.filter((item) => item.completed).length;
			const totalCount = items.length;

			if (todo?.id) {
				// Update existing todo
				await todosStore.update(todo.id, {
					title: title.trim(),
					items,
					color: colorHex,
					completedCount,
					totalCount,
					updatedAt: new Date()
				});
			} else {
				// Create new todo
				const newTodo: ITodo = {
					id: generateId(),
					title: title.trim(),
					items,
					color: colorHex,
					createdAt: new Date(),
					updatedAt: new Date(),
					completedCount,
					totalCount,
					order: Date.now()
				};
				await todosStore.add(newTodo);
			}

			onClose();
		} catch (error) {
			console.error('Failed to save todo:', error);
			alert('Hiba történt a teendő mentése során.');
		} finally {
			isSaving = false;
		}
	}

	function handleColorSelect(color: PastelColorKey) {
		selectedColor = color;
	}

	function handleCancel() {
		onClose();
	}
</script>

<Modal
	bind:isOpen
	{onClose}
	title={todo ? '' : 'Új teendő'}
	maxWidth="700px"
	closeButtonColor={todo ? 'red' : 'blue'}
>
	<form class="todo-editor" onsubmit={handleSubmit}>
		{#if !todo}
			<div class="form-group">
				<label for="todo-title" class="form-label">
					Cím <span class="required">*</span>
				</label>
				<!-- svelte-ignore a11y_autofocus -->
				<input
					id="todo-title"
					type="text"
					class="input"
					bind:value={title}
					placeholder="Add meg a teendő címét..."
					required
					maxlength="100"
					autofocus
				/>
			</div>
		{/if}

		<div class="form-group" role="group" aria-labelledby="todo-items-label">
			<div id="todo-items-label" class="form-label">
				{#if todo}
					Feladatok: {todo.title}
				{:else}
					Teendők <span class="required">*</span>
				{/if}
			</div>
			<div class="todo-items">
				{#if items.length > 0}
					<div
						class="items-list"
						style:--items-list-bg={todo?.color}
						style:--card-tint={cardTint}
						style:--card-glow={cardGlow}
					>
						{#each items as item (item.id)}
							<TodoItem
								{item}
								onToggle={toggleItem}
								onDelete={deleteItem}
								editable={true}
							/>
						{/each}
					</div>
				{/if}

				<div class="add-item">
					<label for="new-todo-item" class="sr-only">Új teendő szövege</label>
					<input
						id="new-todo-item"
						type="text"
						class="input"
						bind:value={newItemText}
						placeholder="Új teendő hozzáadása..."
						onkeydown={handleItemKeydown}
					/>
					<button
						type="button"
						class="button button--add"
						onclick={addItem}
						disabled={!newItemText.trim()}
						aria-label="Teendő hozzáadása a listához"
					>
						Hozzáad
					</button>
				</div>
			</div>
		</div>

		{#if !todo}
			<div class="form-group" role="group" aria-labelledby="todo-color-label">
				<div id="todo-color-label" class="form-label">Szín</div>
				<ColorPicker {selectedColor} onSelect={handleColorSelect} />
			</div>

			<div class="form-actions">
				<button
					type="button"
					class="button button--secondary"
					onclick={handleCancel}
					disabled={isSaving}
				>
					Mégse
				</button>
				<button
					type="submit"
					class="button button--primary"
					disabled={isSaving || !title.trim() || items.length === 0}
				>
					{isSaving ? 'Mentés...' : 'Létrehozás'}
				</button>
			</div>
		{/if}
	</form>
</Modal>

<style>
	.todo-editor {
		display: flex;
		flex-direction: column;
		gap: var(--gap-form-fields);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.form-label {
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
		color: var(--text-secondary);
	}

	.required {
		color: var(--color-error);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	.input {
		width: 100%;
		padding: var(--padding-input);
		border: none;
		border-radius: 16px;
		font-size: var(--text-base);
		font-family: var(--font-system);
		background: #F7F8FC;
		color: var(--text-primary);
		transition: all 200ms ease;
	}

	/* Dark mode - darker borders for inputs */
	:global([data-theme="dark"]) .input {
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.input:focus {
		outline: none;
		border-color: var(--color-info);
		box-shadow:
			0 0 0 3px rgba(0, 122, 255, 0.1),
			0 2px 8px rgba(0, 122, 255, 0.1);
	}

	.input::placeholder {
		color: #A3A6B6;
	}

	.todo-items {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-3);
		background: linear-gradient(145deg, var(--items-list-bg, #F7F8FC) 0%, #FFFFFF 85%);
		border: none;
		border-radius: 20px;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.04),
			0 12px 30px rgba(0, 0, 0, 0.06);
		max-height: 500px;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
		position: relative;
	}

	/* Light mode - inner aura effect */
	.items-list::before {
		content: "";
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.3;
		background: radial-gradient(
			circle at 15% 10%,
			var(--items-list-bg, rgba(247, 248, 252, 0.5)) 0%,
			#FFFFFF 60%
		);
		z-index: 0;
		border-radius: 20px;
	}

	/* Ensure content is above the aura overlay */
	.items-list > * {
		position: relative;
		z-index: 1;
	}

	.items-list::-webkit-scrollbar {
		display: block;
		width: 8px;
	}

	.items-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.items-list::-webkit-scrollbar-thumb {
		background-color: rgba(0, 0, 0, 0.3);
		border-radius: 4px;
	}

	.items-list::-webkit-scrollbar-thumb:hover {
		background-color: rgba(0, 0, 0, 0.5);
	}

	/* Dark mode - use AMOLED surface with aura effect */
	:global([data-theme="dark"]) .items-list {
		background: var(--amoled-surface-1) !important;
		border: 1px solid var(--amoled-border);
		box-shadow: none;
		scrollbar-color: rgba(255, 255, 255, 0.4) transparent;
	}

	/* Dark mode - aura overlay effect (same as cards on main page) */
	:global([data-theme="dark"]) .items-list::before {
		opacity: 1;
		background: radial-gradient(
			circle at 15% 10%,
			var(--card-tint, rgba(255, 255, 255, 0.10)) 0%,
			transparent 55%
		);
		border-radius: 20px;
	}

	:global([data-theme="dark"]) .items-list::-webkit-scrollbar-thumb {
		background-color: rgba(255, 255, 255, 0.4);
	}

	:global([data-theme="dark"]) .items-list::-webkit-scrollbar-thumb:hover {
		background-color: rgba(255, 255, 255, 0.6);
	}

	.add-item {
		display: flex;
		gap: var(--space-2);
	}

	.add-item .input {
		flex: 1;
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		margin-top: var(--space-4);
		padding-top: var(--space-4);
		border-top: 1px solid var(--border-light);
	}

	.button {
		border-radius: 12px;
		padding: var(--padding-button);
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		transition: all 200ms ease;
		border: none;
		cursor: pointer;
		white-space: nowrap;
	}

	.button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.button--primary {
		background: #5AC9A0;
		color: white;
		box-shadow: 0 4px 12px rgba(90, 201, 160, 0.3);
	}

	.button--primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 20px rgba(90, 201, 160, 0.4);
	}

	.button--primary:active:not(:disabled) {
		transform: translateY(0);
	}

	.button--secondary {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.button--secondary:hover:not(:disabled) {
		background: var(--bg-secondary);
	}

	.button--secondary:active:not(:disabled) {
		transform: scale(0.98);
	}

	/* Dark mode - lighter background for secondary button */
	:global([data-theme="dark"]) .button--secondary {
		background: #636366;
	}

	.button--add {
		background: linear-gradient(135deg, #5DA9FF, #2F80ED);
		color: #FFFFFF;
		padding: var(--padding-input);
		border-radius: 20px;
		font-size: 18px;
		font-weight: 600;
	}

	.button--add:hover:not(:disabled) {
		box-shadow: 0 6px 20px rgba(47, 128, 237, 0.3);
	}

	.button--add:active:not(:disabled) {
		transform: scale(0.98);
	}

	/* Responsive */
	@media (max-width: 640px) {
		.items-list {
			max-height: 70vh !important;
			max-height: 70dvh !important;
		}

		.form-group {
			gap: var(--space-1);
		}

		.form-actions {
			flex-direction: column-reverse;
		}

		.form-actions .button {
			width: 100%;
		}

		.add-item {
			flex-direction: column;
		}

		.button--add {
			width: 100%;
		}
	}
</style>

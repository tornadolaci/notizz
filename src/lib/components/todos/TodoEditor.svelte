<script lang="ts">
	/**
	 * TodoEditor Component
	 * Modal form for creating and editing todos with items
	 */
	import { todosStore } from '$lib/stores/todos';
	import type { ITodo, ITodoItem } from '$lib/types/todo';
	import { DEFAULT_COLOR, PASTEL_COLORS, type PastelColorKey } from '$lib/constants/colors';
	import Modal from '$lib/components/common/Modal.svelte';
	import ColorPicker from '$lib/components/notes/ColorPicker.svelte';
	import TagInput from '$lib/components/shared/TagInput.svelte';
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
	let selectedColor = $state<PastelColorKey>(DEFAULT_COLOR);
	let tags = $state<string[]>([]);
	let isUrgent = $state(false);
	let isSaving = $state(false);

	// New item input
	let newItemText = $state('');

	// Populate form when editing existing todo
	$effect(() => {
		if (isOpen) {
			if (todo) {
				title = todo.title;
				items = [...todo.items];
				selectedColor = todo.color as PastelColorKey;
				tags = [...todo.tags];
				isUrgent = todo.isUrgent;
			} else {
				// Reset form for new todo
				title = '';
				items = [];
				selectedColor = DEFAULT_COLOR;
				tags = [];
				isUrgent = false;
			}
			newItemText = '';
		}
	});

	function addItem() {
		const trimmedText = newItemText.trim();
		if (trimmedText) {
			const newItem: ITodoItem = {
				id: generateId(),
				text: trimmedText,
				completed: false,
				createdAt: new Date()
			};
			items = [...items, newItem];
			newItemText = '';
		}
	}

	function handleItemKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addItem();
		}
	}

	function toggleItem(id: string) {
		items = items.map((item) =>
			item.id === id ? { ...item, completed: !item.completed } : item
		);
	}

	function deleteItem(id: string) {
		items = items.filter((item) => item.id !== id);
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
					tags,
					isUrgent,
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
					tags,
					createdAt: new Date(),
					updatedAt: new Date(),
					isUrgent,
					completedCount,
					totalCount
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

	function handleTagsChange(newTags: string[]) {
		tags = newTags;
	}

	function handleCancel() {
		onClose();
	}
</script>

<Modal
	bind:isOpen
	{onClose}
	title={todo ? 'Teendő szerkesztése' : 'Új teendő'}
	maxWidth="700px"
>
	<form class="todo-editor" onsubmit={handleSubmit}>
		<div class="form-group">
			<label for="todo-title" class="form-label">
				Cím <span class="required">*</span>
			</label>
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

		<div class="form-group">
			<label class="form-label">
				Teendők <span class="required">*</span>
			</label>
			<div class="todo-items">
				{#if items.length > 0}
					<div class="items-list">
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
					<input
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
					>
						Hozzáad
					</button>
				</div>
			</div>
		</div>

		<div class="form-group">
			<label class="form-label">Szín</label>
			<ColorPicker {selectedColor} onSelect={handleColorSelect} />
		</div>

		<div class="form-group">
			<label class="form-label">Címkék</label>
			<TagInput {tags} onTagsChange={handleTagsChange} />
		</div>

		<div class="form-group">
			<label class="checkbox-label">
				<input type="checkbox" bind:checked={isUrgent} class="checkbox-input" />
				<span class="checkbox-text">Sürgős</span>
			</label>
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
				{isSaving ? 'Mentés...' : todo ? 'Frissítés' : 'Létrehozás'}
			</button>
		</div>
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

	.input {
		width: 100%;
		padding: var(--padding-input);
		border: 1px solid var(--border-light);
		border-radius: 12px;
		font-size: var(--text-base);
		font-family: var(--font-system);
		background: var(--bg-primary);
		color: var(--text-primary);
		transition: all 200ms ease;
	}

	.input:focus {
		outline: none;
		border-color: var(--color-info);
		box-shadow:
			0 0 0 3px rgba(0, 122, 255, 0.1),
			0 2px 8px rgba(0, 122, 255, 0.1);
	}

	.input::placeholder {
		color: var(--text-tertiary);
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
		background: var(--bg-secondary);
		border-radius: 12px;
		max-height: 300px;
		overflow-y: auto;
	}

	.add-item {
		display: flex;
		gap: var(--space-2);
	}

	.add-item .input {
		flex: 1;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		cursor: pointer;
		user-select: none;
	}

	.checkbox-input {
		width: 20px;
		height: 20px;
		cursor: pointer;
		accent-color: var(--color-urgent);
	}

	.checkbox-text {
		font-size: var(--text-base);
		color: var(--text-primary);
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
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	.button--primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
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

	.button--add {
		background: var(--color-info);
		color: white;
		padding: var(--padding-input);
	}

	.button--add:hover:not(:disabled) {
		background: #0056cc;
	}

	.button--add:active:not(:disabled) {
		transform: scale(0.98);
	}

	/* Responsive */
	@media (max-width: 640px) {
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

<script lang="ts">
	/**
	 * NoteEditor Component
	 * Modal form for creating and editing notes
	 */
	import { notesStore } from '$lib/stores/notes';
	import type { INote } from '$lib/types/note';
	import { DEFAULT_NOTE_COLOR, PASTEL_COLORS, hexToColorKey, type PastelColorKey } from '$lib/constants/colors';
	import Modal from '$lib/components/common/Modal.svelte';
	import ColorPicker from './ColorPicker.svelte';
	import { generateId } from '$lib/utils/uuid';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		note?: INote | null;
	}

	let { isOpen = $bindable(false), onClose, note = null }: Props = $props();

	// Form state
	let title = $state('');
	let content = $state('');
	let selectedColor = $state<PastelColorKey>(DEFAULT_NOTE_COLOR);
	let isSaving = $state(false);

	// Populate form when editing existing note
	$effect(() => {
		if (isOpen) {
			if (note) {
				title = note.title;
				content = note.content;
				selectedColor = hexToColorKey(note.color);
			} else {
				// Reset form for new note - use default note color (lemon)
				title = '';
				content = '';
				selectedColor = DEFAULT_NOTE_COLOR;
			}
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (!title.trim()) {
			alert('A cím megadása kötelező!');
			return;
		}

		isSaving = true;

		try {
			// Convert color key to HEX value
			const colorHex = PASTEL_COLORS[selectedColor];

			if (note?.id) {
				// Update existing note
				await notesStore.update(note.id, {
					title: title.trim(),
					content: content.trim(),
					color: colorHex,
					updatedAt: new Date()
				});
			} else {
				// Create new note
				const newNote: INote = {
					id: generateId(),
					title: title.trim(),
					content: content.trim(),
					color: colorHex,
					createdAt: new Date(),
					updatedAt: new Date(),
					order: Date.now()
				};
				await notesStore.add(newNote);
			}

			onClose();
		} catch (error) {
			console.error('Failed to save note:', error);
			alert('Hiba történt a jegyzet mentése során.');
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
	title={note ? 'Jegyzet szerkesztése' : 'Új jegyzet'}
	maxWidth="700px"
>
	<form class="note-editor" onsubmit={handleSubmit}>
		<div class="form-group">
			<label for="note-title" class="form-label">
				Cím <span class="required">*</span>
			</label>
			<input
				id="note-title"
				type="text"
				class="input"
				bind:value={title}
				placeholder="Add meg a jegyzet címét..."
				required
				maxlength="100"
				autofocus
			/>
		</div>

		<div class="form-group">
			<label for="note-content" class="form-label">Tartalom</label>
			<textarea
				id="note-content"
				class="textarea"
				bind:value={content}
				placeholder="Írd ide a jegyzet tartalmát..."
				rows="6"
				style:--textarea-bg={note?.color}
			></textarea>
		</div>

		{#if !note}
			<div class="form-group">
				<label class="form-label">Szín</label>
				<ColorPicker {selectedColor} onSelect={handleColorSelect} />
			</div>
		{/if}

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
				disabled={isSaving || !title.trim()}
			>
				{isSaving ? 'Mentés...' : note ? 'Mentés' : 'Létrehozás'}
			</button>
		</div>
	</form>
</Modal>

<style>
	.note-editor {
		display: flex;
		flex-direction: column;
		gap: var(--gap-form-fields);
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		width: 100%;
		box-sizing: border-box;
	}

	.form-label {
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
		color: var(--text-secondary);
	}

	.required {
		color: var(--color-error);
	}

	.input,
	.textarea {
		width: 100%;
		padding: var(--padding-input);
		border: 1px solid var(--border-light);
		border-radius: 12px;
		font-size: var(--text-base);
		font-family: var(--font-system);
		background: var(--bg-primary);
		color: var(--text-primary);
		transition: all 200ms ease;
		box-sizing: border-box;
		max-width: 100%;
	}

	.input:focus,
	.textarea:focus {
		outline: none;
		border-color: var(--color-info);
		box-shadow:
			0 0 0 3px rgba(0, 122, 255, 0.1),
			0 2px 8px rgba(0, 122, 255, 0.1);
	}

	.input::placeholder,
	.textarea::placeholder {
		color: var(--text-tertiary);
	}

	.textarea {
		min-height: 120px;
		resize: vertical;
		line-height: var(--leading-normal);
		background: var(--textarea-bg, var(--bg-primary));
	}

	/* Dark mode - always use default background and darker borders */
	:global([data-theme="dark"]) .textarea {
		background: var(--bg-primary);
	}

	:global([data-theme="dark"]) .input,
	:global([data-theme="dark"]) .textarea {
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		margin-top: var(--space-4);
		padding-top: var(--space-4);
		border-top: 1px solid var(--border-light);
		width: 100%;
		box-sizing: border-box;
	}

	.button {
		border-radius: 12px;
		padding: var(--padding-button);
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		transition: all 200ms ease;
		border: none;
		cursor: pointer;
		position: relative;
		overflow: hidden;
		box-sizing: border-box;
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

	/* Responsive */
	@media (max-width: 640px) {
		.form-actions {
			flex-direction: column-reverse;
		}

		.button {
			width: 100%;
		}
	}
</style>

<script lang="ts">
	/**
	 * NoteEditor Component
	 * Modal form for creating and editing notes
	 */
	import { notesStore } from '$lib/stores/notes';
	import type { INote } from '$lib/types/note';
	import { DEFAULT_COLOR, type PastelColorKey } from '$lib/constants/colors';
	import Modal from '$lib/components/common/Modal.svelte';
	import ColorPicker from './ColorPicker.svelte';
	import TagInput from '$lib/components/shared/TagInput.svelte';
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
	let selectedColor = $state<PastelColorKey>(DEFAULT_COLOR);
	let tags = $state<string[]>([]);
	let isUrgent = $state(false);
	let isSaving = $state(false);

	// Populate form when editing existing note
	$effect(() => {
		if (isOpen) {
			if (note) {
				title = note.title;
				content = note.content;
				selectedColor = note.color as PastelColorKey;
				tags = [...note.tags];
				isUrgent = note.isUrgent;
			} else {
				// Reset form for new note
				title = '';
				content = '';
				selectedColor = DEFAULT_COLOR;
				tags = [];
				isUrgent = false;
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
			if (note?.id) {
				// Update existing note
				await notesStore.update(note.id, {
					title: title.trim(),
					content: content.trim(),
					color: selectedColor,
					tags,
					isUrgent,
					updatedAt: new Date()
				});
			} else {
				// Create new note
				const newNote: INote = {
					id: generateId(),
					title: title.trim(),
					content: content.trim(),
					color: selectedColor,
					tags,
					createdAt: new Date(),
					updatedAt: new Date(),
					isUrgent
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
			></textarea>
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
				disabled={isSaving || !title.trim()}
			>
				{isSaving ? 'Mentés...' : note ? 'Frissítés' : 'Létrehozás'}
			</button>
		</div>
	</form>
</Modal>

<style>
	.note-editor {
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
		position: relative;
		overflow: hidden;
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

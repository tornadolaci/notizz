<script lang="ts">
	/**
	 * NoteEditor Component
	 * Modal form for creating and editing notes
	 */
	import { notesStore } from '$lib/stores/notes';
	import type { INote } from '$lib/types/note';
	import { DEFAULT_NOTE_COLOR, PASTEL_COLORS, hexToColorKey, getDarkTint, getGlowColor, type PastelColorKey } from '$lib/constants/colors';
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

	// Dark mode dynamic colors for aura effect
	const cardTint = $derived(note?.color ? getDarkTint(note.color) : null);
	const cardGlow = $derived(note?.color ? getGlowColor(note.color) : null);

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
	closeButtonColor="red"
>
	<form class="note-editor" onsubmit={handleSubmit}>
		<div class="form-group">
			<label for="note-title" class="form-label">
				Cím <span class="required">*</span>
			</label>
			<!-- svelte-ignore a11y_autofocus -->
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
			<div
				class="textarea-wrapper"
				style:--textarea-bg={note?.color}
				style:--card-tint={cardTint}
				style:--card-glow={cardGlow}
			>
				<textarea
					id="note-content"
					class="textarea"
					bind:value={content}
					placeholder="Írd ide a jegyzet tartalmát..."
					rows="6"
				></textarea>
			</div>
		</div>

		{#if !note}
			<div class="form-group" role="group" aria-labelledby="note-color-label">
				<div id="note-color-label" class="form-label">Szín</div>
				<ColorPicker {selectedColor} onSelect={handleColorSelect} />
			</div>
		{/if}

		<div class="form-actions">
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
		box-sizing: border-box;
		max-width: 100%;
	}

	.input:focus {
		outline: none;
		border-color: var(--color-info);
		box-shadow:
			0 0 0 3px rgba(0, 122, 255, 0.1),
			0 2px 8px rgba(0, 122, 255, 0.1);
	}

	.input::placeholder,
	.textarea::placeholder {
		color: #A3A6B6;
	}

	.textarea {
		padding: var(--padding-input);
		font-size: var(--text-base);
		font-family: var(--font-system);
		color: var(--text-primary);
		transition: all 200ms ease;
		box-sizing: border-box;
		max-width: 100%;
	}

	.textarea-wrapper {
		position: relative;
		background: linear-gradient(145deg, var(--textarea-bg, #F7F8FC) 0%, #FFFFFF 85%);
		border: none;
		border-radius: 20px;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.04),
			0 12px 30px rgba(0, 0, 0, 0.06);
		overflow: hidden;
	}

	/* Light mode - inner aura effect */
	.textarea-wrapper::before {
		content: "";
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.3;
		background: radial-gradient(
			circle at 15% 10%,
			var(--textarea-bg, rgba(247, 248, 252, 0.5)) 0%,
			#FFFFFF 60%
		);
		z-index: 0;
		border-radius: 20px;
	}

	.textarea {
		width: 100%;
		min-height: 400px;
		resize: vertical;
		line-height: var(--leading-normal);
		background: transparent;
		border: none;
		position: relative;
		z-index: 1;
	}

	.textarea:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
	}

	/* Dark mode - use AMOLED surface with aura effect */
	:global([data-theme="dark"]) .textarea-wrapper {
		background: var(--amoled-surface-1);
		box-shadow: none;
		border: 1px solid var(--amoled-border);
	}

	/* Dark mode - aura overlay effect */
	:global([data-theme="dark"]) .textarea-wrapper::before {
		opacity: 1;
		background: radial-gradient(
			circle at 15% 10%,
			var(--card-tint, rgba(255, 255, 255, 0.10)) 0%,
			transparent 55%
		);
	}

	/* Dark mode - darker background and borders for inputs */
	:global([data-theme="dark"]) .input {
		background: #151A2A; /* --surface-2 from design tokens */
		color: #F2F3F7; /* --text-primary from design tokens */
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

	/* Responsive */
	@media (max-width: 640px) {
		.textarea {
			min-height: 60vh;
			min-height: 60dvh;
		}

		.form-group {
			gap: var(--space-1);
		}

		.form-actions {
			flex-direction: column-reverse;
		}

		.button {
			width: 100%;
		}
	}
</style>

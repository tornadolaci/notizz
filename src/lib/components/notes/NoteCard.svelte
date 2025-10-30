<script lang="ts">
  import type { INote } from '$lib/types';
  import { formatDistanceToNow } from 'date-fns';
  import { hu } from 'date-fns/locale';
  import { createDragHandler, getDragTransform, type DragState, type SwipeDirection } from '$lib/utils/gestures';

  interface Props {
    note: INote;
    index?: number;
    onEdit?: () => void;
    onDelete?: () => void;
  }

  let { note, index = 0, onEdit, onDelete }: Props = $props();

  let cardElement: HTMLElement;
  let dragOffset = $state({ x: 0, y: 0 });
  let isDragging = $state(false);
  let swipeAction = $state<'edit' | 'delete' | null>(null);

  const SWIPE_THRESHOLD = 100;

  const timeAgo = $derived(() => {
    return formatDistanceToNow(note.updatedAt, {
      addSuffix: true,
      locale: hu
    });
  });

  $effect(() => {
    if (!cardElement) return;

    const cleanup = createDragHandler(
      cardElement,
      {
        onDragStart: () => {
          isDragging = true;
        },
        onDrag: (state: DragState) => {
          // Only horizontal swipe
          dragOffset.x = state.deltaX;
          dragOffset.y = 0;

          // Determine swipe action based on direction
          if (state.deltaX < -SWIPE_THRESHOLD) {
            swipeAction = 'edit'; // Swipe left = edit
          } else if (state.deltaX > SWIPE_THRESHOLD) {
            swipeAction = 'delete'; // Swipe right = delete
          } else {
            swipeAction = null;
          }
        },
        onDragEnd: (_state: DragState, swipe: SwipeDirection) => {
          isDragging = false;

          // Trigger actions based on swipe
          if (swipe.direction === 'left' && onEdit) {
            onEdit();
          } else if (swipe.direction === 'right' && onDelete) {
            onDelete();
          }

          // Reset state
          dragOffset.x = 0;
          dragOffset.y = 0;
          swipeAction = null;
        }
      },
      {
        threshold: SWIPE_THRESHOLD,
        maxDuration: 500,
        minVelocity: 0.3,
        hapticFeedback: true
      }
    );

    return cleanup;
  });

  function handleClick() {
    // Prevent click if dragging
    if (isDragging || Math.abs(dragOffset.x) > 5) return;

    if (onEdit) {
      onEdit();
    }
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }
</script>

<div class="card-wrapper">
  <!-- Swipe action backgrounds -->
  <div class="swipe-action swipe-action--edit" class:swipe-action--active={swipeAction === 'edit'}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>Szerkesztés</span>
  </div>

  <div class="swipe-action swipe-action--delete" class:swipe-action--active={swipeAction === 'delete'}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <polyline points="3 6 5 6 21 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>Törlés</span>
  </div>

  <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
  <article
    bind:this={cardElement}
    class="card"
    class:card--urgent={note.isUrgent}
    class:card--dragging={isDragging}
    style:--card-color={note.color}
    style:--index={index}
    style:transform={getDragTransform(dragOffset.x, dragOffset.y, 200)}
    onclick={handleClick}
    onkeydown={handleKeydown}
    role="button"
    tabindex="0"
    aria-label="Jegyzet: {note.title}"
  >
  {#if note.isUrgent}
    <div class="card__badge" aria-label="Sürgős">!</div>
  {/if}

  {#if onDelete}
    <button
      class="card__delete"
      onclick={handleDelete}
      aria-label="Jegyzet törlése"
      title="Törlés"
      type="button"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
        <path d="M12 4L4 12M4 4l8 8" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  {/if}

  <div class="card__header">
    <h3 class="card__title">{note.title}</h3>
  </div>

  <div class="card__content">
    <p class="card__text">{note.content}</p>
  </div>

  {#if note.tags.length > 0}
    <div class="card__tags">
      {#each note.tags as tag}
        <span class="tag">{tag}</span>
      {/each}
    </div>
  {/if}

  <div class="card__footer">
    <time class="card__time" datetime={note.updatedAt.toISOString()}>
      {timeAgo()}
    </time>
  </div>
  </article>
</div>

<style>
  .card-wrapper {
    position: relative;
    isolation: isolate;
  }

  .swipe-action {
    position: absolute;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: 0 var(--space-6);
    border-radius: 20px;
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    opacity: 0;
    transition: opacity 200ms ease;
    pointer-events: none;
    z-index: 0;
  }

  .swipe-action--edit {
    left: 0;
    right: 50%;
    background: var(--color-info);
    color: white;
  }

  .swipe-action--delete {
    left: 50%;
    right: 0;
    background: var(--color-error);
    color: white;
  }

  .swipe-action--active {
    opacity: 1;
  }

  .swipe-action svg {
    flex-shrink: 0;
  }

  .card {
    /* Layout */
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--padding-card);

    /* Appearance */
    background: var(--card-color);
    border-radius: 20px;
    cursor: pointer;

    /* Animation */
    transition: transform 0ms, box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1);
    animation: slideUp 400ms ease both;
    animation-delay: calc(var(--index) * 50ms);

    /* Shadow */
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 4px 8px rgba(0, 0, 0, 0.06),
      0 8px 16px rgba(0, 0, 0, 0.08);

    /* Layering */
    z-index: 1;
  }

  .card--dragging {
    transition: none;
  }

  .card:hover {
    transform: translateY(-2px) scale(1.01);
    box-shadow:
      0 4px 8px rgba(0, 0, 0, 0.08),
      0 12px 24px rgba(0, 0, 0, 0.12);
  }

  .card:active {
    transform: scale(0.98);
  }

  .card:focus-visible {
    outline: 2px solid var(--color-info);
    outline-offset: 2px;
  }

  .card--urgent {
    border: 2px solid var(--color-urgent);
    box-shadow:
      0 0 0 1px var(--color-urgent),
      0 4px 12px rgba(255, 107, 107, 0.2);
  }

  .card__badge {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-urgent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-bold);
    font-size: var(--text-sm);
    animation: pulse 2s ease-in-out infinite;
    z-index: 1;
  }

  .card__delete {
    position: absolute;
    top: 12px;
    left: 12px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-tertiary);
    transition: all 200ms ease;
    opacity: 0;
    z-index: 2;
  }

  .card:hover .card__delete {
    opacity: 1;
  }

  .card__delete:hover {
    background: var(--color-error);
    color: white;
    transform: scale(1.1);
  }

  .card__delete:active {
    transform: scale(0.95);
  }

  /* Touch devices - always show delete button */
  @media (hover: none) {
    .card__delete {
      opacity: 1;
      background: rgba(255, 255, 255, 0.8);
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }

  .card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card__title {
    font-size: var(--text-md);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0;
    line-height: var(--leading-tight);
  }

  .card__content {
    flex: 1;
  }

  .card__text {
    font-size: var(--text-base);
    color: var(--text-secondary);
    line-height: var(--leading-normal);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .tag {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    background: rgba(0, 0, 0, 0.05);
    padding: 4px 8px;
    border-radius: 6px;
    font-weight: var(--font-medium);
  }

  .card__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .card__time {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Dark mode adjustments */
  :global([data-theme="dark"]) .card {
    opacity: 0.95;
  }

  :global([data-theme="dark"]) .tag {
    background: rgba(255, 255, 255, 0.1);
  }
</style>

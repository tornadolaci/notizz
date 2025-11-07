<script lang="ts">
  import type { ITodo } from '$lib/types';
  import TodoProgress from './TodoProgress.svelte';
  import { formatDistanceToNow } from 'date-fns';
  import { hu } from 'date-fns/locale';

  interface Props {
    todo: ITodo;
    index?: number;
    onEdit?: () => void;
    onDelete?: () => void;
    onToggleItem?: (todoId: string, itemId: string) => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
  }

  let { todo, index = 0, onEdit, onDelete, onToggleItem, onMoveUp, onMoveDown, isFirst = false, isLast = false }: Props = $props();

  const timeAgo = $derived(() => {
    return formatDistanceToNow(todo.updatedAt, {
      addSuffix: true,
      locale: hu
    });
  });

  const completedCount = $derived(() => {
    return todo.items.filter(item => item.completed).length;
  });

  const isAllCompleted = $derived(() => {
    return completedCount() === todo.totalCount && todo.totalCount > 0;
  });

  function handleClick() {
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

  function handleMoveUp(e: MouseEvent) {
    e.stopPropagation();
    if (onMoveUp) {
      onMoveUp();
    }
  }

  function handleMoveDown(e: MouseEvent) {
    e.stopPropagation();
    if (onMoveDown) {
      onMoveDown();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<article
  class="card"
  class:card--urgent={todo.isUrgent}
  class:card--completed={isAllCompleted()}
  style:--card-color={todo.color}
  style:--index={index}
  onclick={handleClick}
  onkeydown={handleKeydown}
  role="button"
  tabindex="0"
  aria-label="TODO lista: {todo.title}"
>
  {#if todo.isUrgent}
    <div class="card__badge" aria-label="Sürgős">!</div>
  {/if}

  {#if onDelete}
    <button
      class="card__delete"
      onclick={handleDelete}
      aria-label="Teendő törlése"
      title="Törlés"
      type="button"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="10" y1="11" x2="10" y2="17" stroke-width="2" stroke-linecap="round"/>
        <line x1="14" y1="11" x2="14" y2="17" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  {/if}

  <div class="card__header">
    <h3 class="card__title">{todo.title}</h3>
  </div>

  <div class="card__content">
    <ul class="todo-list">
      {#each todo.items.slice(0, 3) as item}
        <li class="todo-item" class:todo-item--completed={item.completed}>
          <span class="checkbox" class:checkbox--checked={item.completed}></span>
          <span class="todo-text">{item.text}</span>
        </li>
      {/each}
      {#if todo.items.length > 3}
        <li class="todo-more">
          +{todo.items.length - 3} további
        </li>
      {/if}
    </ul>
  </div>

  <div class="card__progress">
    <TodoProgress completed={completedCount()} total={todo.totalCount} />
  </div>

  <div class="card__footer">
    <div class="card__navigation">
      {#if onMoveDown && !isLast}
        <button
          class="card__nav-btn card__nav-btn--down"
          onclick={handleMoveDown}
          aria-label="Kártya mozgatása lefelé"
          title="Lefelé"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
            <path d="M10 6L10 14M10 14L6 10M10 14L14 10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      {/if}
      {#if onMoveUp && !isFirst}
        <button
          class="card__nav-btn card__nav-btn--up"
          onclick={handleMoveUp}
          aria-label="Kártya mozgatása felfelé"
          title="Felfelé"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
            <path d="M10 14L10 6M10 6L14 10M10 6L6 10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      {/if}
    </div>
    <time class="card__time" datetime={todo.updatedAt.toISOString()}>
      {timeAgo()}
    </time>
  </div>
  </article>

<style>
  .card {
    /* Layout */
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--padding-card);
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    overflow: hidden;

    /* Appearance */
    background: var(--card-color);
    border-radius: 20px;
    cursor: pointer;

    /* Animation */
    transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1);
    animation: slideUp 400ms ease both;
    animation-delay: calc(var(--index) * 50ms);

    /* Shadow - Mérsékelt árnyékok */
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.06),
      0 4px 12px rgba(0, 0, 0, 0.08),
      0 8px 20px rgba(0, 0, 0, 0.10);
  }

  @media (max-width: 375px) {
    .card {
      padding: 12px;
      gap: 8px;
    }
  }

  .card:hover {
    transform: translateY(-2px) scale(1.01);
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.10),
      0 8px 20px rgba(0, 0, 0, 0.12),
      0 16px 32px rgba(0, 0, 0, 0.14);
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

  .card--completed {
    opacity: 0.7;
  }

  .card__badge {
    position: absolute;
    top: 12px;
    left: 12px;
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
    right: 12px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-info);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    transition: all 200ms ease;
    opacity: 0;
    z-index: 2;
  }

  .card:hover .card__delete {
    opacity: 1;
  }

  .card__delete:hover {
    background: #0051D5;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.5);
  }

  .card__delete:active {
    transform: scale(0.95);
  }

  /* Touch devices - always show delete button */
  @media (hover: none) {
    .card__delete {
      opacity: 1;
    }
  }

  @media (max-width: 375px) {
    .card__delete {
      width: 36px;
      height: 36px;
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
    max-width: 100%;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    hyphens: auto;
  }

  .card__content {
    flex: 1;
    min-width: 0;
  }

  .todo-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--gap-list-items);
  }

  .todo-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .checkbox {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-medium);
    border-radius: 6px;
    position: relative;
    transition: all 200ms ease;
  }

  .checkbox--checked {
    background: var(--color-success);
    border-color: var(--color-success);
  }

  .checkbox--checked::after {
    content: '';
    position: absolute;
    left: 5px;
    top: 1px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    animation: checkmark 200ms ease;
  }

  @keyframes checkmark {
    0% {
      transform: rotate(45deg) scale(0);
    }
    50% {
      transform: rotate(45deg) scale(1.2);
    }
    100% {
      transform: rotate(45deg) scale(1);
    }
  }

  .todo-text {
    font-size: var(--text-base);
    color: var(--text-secondary);
    line-height: var(--leading-normal);
    flex: 1;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .todo-item--completed .todo-text {
    text-decoration: line-through;
    opacity: 0.5;
  }

  .todo-more {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    font-style: italic;
    padding-left: calc(20px + var(--space-3));
  }

  .card__progress {
    padding-top: var(--space-2);
  }

  .card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .card__navigation {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .card__nav-btn {
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 0, 0, 0.1);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
    transform: scale(0.9);
    z-index: 3;
  }

  .card:hover .card__nav-btn {
    opacity: 1;
    transform: scale(1);
  }

  .card__nav-btn:hover {
    background: rgba(255, 255, 255, 1);
    color: var(--color-info);
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .card__nav-btn:active {
    transform: scale(0.95);
    transition: all 100ms ease;
  }

  /* Touch devices - always show navigation buttons */
  @media (hover: none) {
    .card__nav-btn {
      opacity: 1;
      transform: scale(1);
      background: rgba(255, 255, 255, 0.85);
    }
  }

  /* Mobile optimization */
  @media (max-width: 375px) {
    .card__nav-btn {
      width: 40px;
      height: 40px;
      min-width: 40px;
      min-height: 40px;
    }
  }

  .card__time {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    flex-shrink: 0;
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
    background: #293F3F !important;
  }

  :global([data-theme="dark"]) .card__nav-btn {
    background: rgba(50, 50, 50, 0.9);
    border-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }

  :global([data-theme="dark"]) .card__nav-btn:hover {
    background: rgba(70, 70, 70, 1);
    color: var(--color-info);
  }

  @media (hover: none) {
    :global([data-theme="dark"]) .card__nav-btn {
      background: rgba(50, 50, 50, 0.85);
    }
  }
</style>

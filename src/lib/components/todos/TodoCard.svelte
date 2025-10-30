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
  }

  let { todo, index = 0, onEdit, onDelete, onToggleItem }: Props = $props();

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

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }
</script>

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
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
        <path d="M12 4L4 12M4 4l8 8" stroke-width="2" stroke-linecap="round"/>
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

  {#if todo.tags.length > 0}
    <div class="card__tags">
      {#each todo.tags as tag}
        <span class="tag">{tag}</span>
      {/each}
    </div>
  {/if}

  <div class="card__footer">
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

    /* Appearance */
    background: var(--card-color);
    border-radius: 20px;
    cursor: pointer;

    /* Animation */
    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
    animation: slideUp 400ms ease both;
    animation-delay: calc(var(--index) * 50ms);

    /* Shadow */
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 4px 8px rgba(0, 0, 0, 0.06),
      0 8px 16px rgba(0, 0, 0, 0.08);
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

  .card--completed {
    opacity: 0.7;
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

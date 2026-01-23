<script lang="ts">
  interface Props {
    icon?: 'search' | 'notes' | 'todos' | 'general';
    title: string;
    message: string;
    actionLabel?: string;
    onaction?: () => void;
  }

  let {
    icon = 'general',
    title,
    message,
    actionLabel,
    onaction
  }: Props = $props();

  const icons = {
    search: `<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path>`,
    notes: `<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline>`,
    todos: `<path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>`,
    general: `<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>`
  };
</script>

<div class="empty-state">
  <div class="empty-state-icon">
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {@html icons[icon]}
    </svg>
  </div>

  <h2 class="empty-state-title">
    {#if title.includes('Notizz!')}
      {title.split('Notizz!')[0]}<span class="gradient-text">Notizz!</span>
    {:else}
      {title}
    {/if}
  </h2>
  {#if message}
    <p class="empty-state-message">{message}</p>
  {/if}

  {#if actionLabel && onaction}
    <button type="button" class="empty-state-action" onclick={onaction}>
      {actionLabel}
    </button>
  {/if}
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--space-10) var(--space-4);
    min-height: 300px;
    animation: fadeIn 400ms ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .empty-state-icon {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
    color: var(--color-info);
    margin-bottom: var(--space-5);
    animation: iconPulse 2s ease-in-out infinite;
  }

  @keyframes iconPulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.8;
    }
  }

  .empty-state-title {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-2);
  }

  .gradient-text {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .empty-state-message {
    font-size: var(--text-base);
    color: var(--text-secondary);
    max-width: 400px;
    line-height: var(--leading-relaxed);
    margin: 0 0 var(--space-6);
  }

  .empty-state-action {
    padding: var(--padding-button);
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    cursor: pointer;
    transition: all 200ms ease;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .empty-state-action:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  .empty-state-action:active {
    transform: scale(0.98);
  }

  /* Responsive */
  @media (min-width: 640px) {
    .empty-state {
      padding: var(--space-10) var(--space-6);
    }

    .empty-state-icon {
      width: 100px;
      height: 100px;
    }

    .empty-state-title {
      font-size: var(--text-xl);
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .empty-state,
    .empty-state-icon {
      animation: none;
    }
  }
</style>

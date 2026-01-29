<script lang="ts">
  interface Props {
    completed: number;
    total: number;
  }

  let { completed, total }: Props = $props();

  const percentage = $derived(() => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  });
</script>

<div class="progress" role="progressbar" aria-valuenow={percentage()} aria-valuemin="0" aria-valuemax="100">
  <div class="progress-bar">
    <div class="progress-fill" style:width="{percentage()}%"></div>
  </div>
  <span class="progress-text" aria-label="{completed} / {total} befejezve">
    {completed}/{total}
  </span>
</div>

<style>
  .progress {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .progress-bar {
    flex: 1;
    height: 10px;
    background: #E6E8F0;
    border-radius: 999px;
    overflow: visible;
    padding: 2px;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.08),
                0 1px 2px rgba(255, 255, 255, 0.8);
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #5DA9FF 0%, #2F80ED 100%);
    border-radius: 999px;
    transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(47, 128, 237, 0.3),
                inset 0 1px 1px rgba(255, 255, 255, 0.3);
  }

  .progress-text {
    min-width: 55px;
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: var(--font-semibold);
    font-size: var(--text-base);
    color: #2F80ED;
  }

  @media (max-width: 768px) {
    .progress-text {
      font-size: var(--text-base);
    }
  }

  @media (max-width: 375px) {
    .progress-text {
      font-size: var(--text-base);
    }
  }

  /* Dark mode adjustments */
  :global([data-theme="dark"]) .progress-bar {
    background: rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3),
                0 1px 2px rgba(255, 255, 255, 0.05);
  }

  :global([data-theme="dark"]) .progress-fill {
    background: #007AFF;
    box-shadow: 0 1px 4px rgba(0, 122, 255, 0.5),
                inset 0 1px 1px rgba(255, 255, 255, 0.2);
  }

  :global([data-theme="dark"]) .progress-text {
    color: var(--text-tertiary);
  }
</style>

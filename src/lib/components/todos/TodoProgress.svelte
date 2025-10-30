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
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-tertiary);
  }

  .progress-bar {
    flex: 1;
    height: 6px;
    background: var(--bg-tertiary);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 3px;
    transition: width 300ms ease;
  }

  .progress-text {
    min-width: 50px;
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: var(--font-medium);
  }

  /* Dark mode adjustments */
  :global([data-theme="dark"]) .progress-bar {
    background: var(--dark-bg-tertiary);
  }
</style>

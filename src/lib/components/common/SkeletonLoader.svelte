<script lang="ts">
  /**
   * SkeletonLoader Component
   * Displays skeleton loading states with shimmer effect
   */
  interface Props {
    type?: 'text' | 'title' | 'card' | 'circle' | 'button' | 'custom';
    width?: string;
    height?: string;
    count?: number;
    className?: string;
  }

  let {
    type = 'text',
    width,
    height,
    count = 1,
    className = ''
  }: Props = $props();

  const skeletonClass = $derived(() => {
    const baseClass = 'skeleton';
    const typeClass = type !== 'custom' ? `skeleton--${type}` : '';
    return `${baseClass} ${typeClass} ${className}`.trim();
  });

  const style = $derived(() => {
    const styles: string[] = [];
    if (width) styles.push(`width: ${width}`);
    if (height) styles.push(`height: ${height}`);
    return styles.join('; ');
  });
</script>

{#each Array(count) as _, i}
  <div
    class={skeletonClass()}
    style={style()}
    aria-hidden="true"
    role="status"
    aria-label="Betöltés..."
  ></div>
{/each}

<style>
  /* Additional skeleton styles beyond global ones */
  .skeleton {
    /* Already defined in app.css, this is just for component-specific overrides */
  }
</style>

<script lang="ts">
  /**
   * Button Component
   * General purpose button with variants and ripple effect
   */
  interface Props {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    ripple?: boolean;
    className?: string;
    onclick?: (e: MouseEvent) => void;
    ariaLabel?: string;
  }

  let {
    variant = 'primary',
    size = 'medium',
    type = 'button',
    disabled = false,
    ripple = true,
    className = '',
    onclick,
    ariaLabel,
    children
  }: Props = $props();

  const buttonClass = $derived(() => {
    const classes = ['button', `button--${variant}`, `button--${size}`];
    if (ripple) classes.push('button-ripple');
    if (className) classes.push(className);
    return classes.join(' ');
  });
</script>

<button
  class={buttonClass()}
  {type}
  {disabled}
  onclick={onclick}
  aria-label={ariaLabel}
>
  {@render children?.()}
</button>

<style>
  .button {
    /* Base styles */
    border: none;
    border-radius: 12px;
    padding: var(--padding-button);
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    font-family: var(--font-system);
    cursor: pointer;
    transition: all 200ms ease;
    position: relative;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button:focus-visible {
    outline: 2px solid var(--color-info);
    outline-offset: 2px;
  }

  /* Variants */
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
    transform: translateY(0) scale(0.98);
  }

  .button--secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .button--secondary:hover:not(:disabled) {
    background: var(--bg-secondary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .button--secondary:active:not(:disabled) {
    transform: scale(0.98);
  }

  .button--danger {
    background: var(--color-error);
    color: white;
    box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
  }

  .button--danger:hover:not(:disabled) {
    box-shadow: 0 6px 20px rgba(255, 59, 48, 0.4);
  }

  .button--danger:active:not(:disabled) {
    transform: scale(0.98);
  }

  .button--ghost {
    background: transparent;
    color: var(--color-info);
    border: 2px solid currentColor;
  }

  .button--ghost:hover:not(:disabled) {
    background: rgba(0, 122, 255, 0.1);
  }

  .button--ghost:active:not(:disabled) {
    transform: scale(0.98);
  }

  /* Sizes */
  .button--small {
    padding: 8px 16px;
    font-size: var(--text-sm);
  }

  .button--medium {
    padding: 12px 20px;
    font-size: var(--text-base);
  }

  .button--large {
    padding: 16px 32px;
    font-size: var(--text-md);
  }

  /* Ripple effect - already defined in app.css via button-ripple class */

  /* Dark mode */
  :global([data-theme="dark"]) .button--secondary {
    background: var(--dark-bg-tertiary);
  }

  :global([data-theme="dark"]) .button--secondary:hover:not(:disabled) {
    background: var(--dark-bg-secondary);
  }

  /* Touch devices */
  @media (hover: none), (pointer: coarse) {
    .button:focus-visible {
      outline: none;
    }
  }
</style>

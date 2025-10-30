<script lang="ts">
  interface Props {
    onclick: () => void;
    ariaLabel?: string;
  }

  let { onclick, ariaLabel = 'Új elem létrehozása' }: Props = $props();
</script>

<button
  class="fab"
  onclick={onclick}
  aria-label={ariaLabel}
  type="button"
>
  <span class="fab__icon" aria-hidden="true"></span>
</button>

<style>
  .fab {
    /* Position */
    position: fixed;
    bottom: calc(24px + env(safe-area-inset-bottom));
    right: 24px;
    z-index: 1000;

    /* Size */
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    cursor: pointer;

    /* Appearance */
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow:
      0 4px 12px rgba(102, 126, 234, 0.4),
      0 8px 24px rgba(102, 126, 234, 0.2);

    /* Animation */
    transition: all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .fab:hover {
    transform: rotate(90deg) scale(1.1);
    box-shadow:
      0 6px 16px rgba(102, 126, 234, 0.5),
      0 12px 32px rgba(102, 126, 234, 0.3);
  }

  .fab:active {
    transform: rotate(90deg) scale(0.95);
  }

  .fab:focus-visible {
    outline: 2px solid var(--color-info);
    outline-offset: 2px;
  }

  /* Plus icon using pseudo-elements */
  .fab__icon {
    position: relative;
    width: 24px;
    height: 24px;
  }

  .fab__icon::before,
  .fab__icon::after {
    content: '';
    position: absolute;
    background: white;
    border-radius: 1px;
  }

  .fab__icon::before {
    width: 24px;
    height: 2px;
    left: 0;
    top: 11px;
  }

  .fab__icon::after {
    width: 2px;
    height: 24px;
    left: 11px;
    top: 0;
  }

  /* Touch devices - larger tap target */
  @media (hover: none) {
    .fab {
      width: 64px;
      height: 64px;
    }

    .fab:focus-visible {
      outline: none;
    }
  }
</style>

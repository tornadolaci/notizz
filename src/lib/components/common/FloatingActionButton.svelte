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
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: none;
    cursor: pointer;

    /* Appearance - Soft Premium Light */
    background: linear-gradient(135deg, #7F7FD5 0%, #86A8E7 50%, #91EAE4 100%);
    color: white;
    box-shadow: 0 12px 30px rgba(127, 127, 213, 0.4);

    /* Animation */
    transition: all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .fab:hover {
    transform: rotate(90deg) scale(1.1);
    box-shadow: 0 16px 40px rgba(127, 127, 213, 0.5);
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

  /* Touch devices */
  @media (hover: none), (pointer: coarse) {
    .fab:focus-visible {
      outline: none;
    }
  }

  /* Dark mode - AMOLED Premium Glow */
  :global([data-theme="dark"]) .fab {
    background: linear-gradient(135deg, #78C8FF 0%, #B4AAFF 100%);
    box-shadow:
      0 10px 28px rgba(0, 0, 0, 0.60),
      0 0 0 1px rgba(255, 255, 255, 0.08),
      0 0 30px rgba(120, 200, 255, 0.25);
  }

  :global([data-theme="dark"]) .fab:hover {
    transform: rotate(90deg) scale(1.08);
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.70),
      0 0 0 1px rgba(255, 255, 255, 0.10),
      0 0 40px rgba(120, 200, 255, 0.35);
  }
</style>

<script lang="ts">
  /**
   * Settings Page
   * User preferences and data management
   */

  import { onMount } from 'svelte';
  import { router } from 'tinro';
  import { settingsStore } from '$lib/stores/settings';
  import { exportData, downloadJSON, readFileAsText, validateImportData, importData, type ImportStrategy } from '$lib/utils/export';
  import { PASTEL_COLORS } from '$lib/schemas/settings.schema';

  // Reactive state
  let isExporting = $state(false);
  let isImporting = $state(false);
  let importMessage = $state<string | null>(null);
  let importError = $state<string | null>(null);
  let fileInput: HTMLInputElement;

  // Initialize settings on mount
  onMount(async () => {
    await settingsStore.init();
  });

  // Color options
  const colorOptions = [
    { value: '#E6E6FA', label: 'Levendula' },
    { value: '#FFDAB9', label: 'Barack' },
    { value: '#B2DFDB', label: 'Menta' },
    { value: '#87CEEB', label: 'Égkék' },
    { value: '#FFB6C1', label: 'Rózsa' },
    { value: '#FFFACD', label: 'Citrom' },
    { value: '#B2D3C2', label: 'Zsálya' },
    { value: '#FFB5A7', label: 'Korall' },
  ];

  // Handlers
  async function handleColorChange(color: string) {
    await settingsStore.update({ defaultColor: color });
  }

  async function handleExport() {
    try {
      isExporting = true;
      const data = await exportData();
      downloadJSON(data);
      importMessage = 'Az adatok sikeresen exportálva!';
      setTimeout(() => (importMessage = null), 3000);
    } catch (error) {
      importError = error instanceof Error ? error.message : 'Az export sikertelen';
      setTimeout(() => (importError = null), 5000);
    } finally {
      isExporting = false;
    }
  }

  async function handleImport() {
    fileInput?.click();
  }

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    try {
      isImporting = true;
      importError = null;

      // Read file
      const text = await readFileAsText(file);

      // Validate data
      const data = validateImportData(text);

      // Import data (merge strategy)
      const result = await importData(data, 'merge');

      if (result.success) {
        importMessage = `Import sikeres! ${result.notesImported} jegyzet és ${result.todosImported} TODO importálva.`;
        if (result.conflicts > 0) {
          importMessage += ` (${result.conflicts} ütközés feloldva)`;
        }

        // Reload page after import
        setTimeout(() => window.location.reload(), 2000);
      } else {
        importError = result.message;
      }
    } catch (error) {
      importError = error instanceof Error ? error.message : 'Az import sikertelen';
    } finally {
      isImporting = false;
      // Reset file input
      if (input) input.value = '';
    }
  }

  async function handleReset() {
    if (confirm('Biztosan visszaállítod az alapértelmezett beállításokat?')) {
      await settingsStore.reset();
      importMessage = 'Beállítások visszaállítva!';
      setTimeout(() => (importMessage = null), 3000);
    }
  }

  function goBack() {
    router.goto('/');
  }
</script>

<div class="settings-page">
  <!-- Header -->
  <header class="settings-header">
    <button class="back-button" onclick={goBack} aria-label="Vissza">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </button>
    <h1>Beállítások</h1>
  </header>

  <div class="settings-container">
    <!-- Appearance Settings -->
    <section class="settings-section">
      <h2 class="section-title">Megjelenés</h2>

      <div class="setting-group">
        <label class="setting-label">Alapértelmezett szín</label>
        <div class="color-picker">
          {#each colorOptions as color}
            <button
              class="color-option"
              class:selected={$settingsStore.defaultColor === color.value}
              style="background-color: {color.value}"
              onclick={() => handleColorChange(color.value)}
              aria-label={color.label}
              title={color.label}
            >
              {#if $settingsStore.defaultColor === color.value}
                <span class="checkmark">✓</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>

    </section>

    <!-- Data Management -->
    <section class="settings-section">
      <h2 class="section-title">Adatkezelés</h2>

      <div class="action-buttons">
        <button class="action-button" onclick={handleExport} disabled={isExporting}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          {isExporting ? 'Exportálás...' : 'Adatok exportálása'}
        </button>

        <button class="action-button" onclick={handleImport} disabled={isImporting}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          {isImporting ? 'Importálás...' : 'Adatok importálása'}
        </button>

        <button class="action-button action-button--danger" onclick={handleReset}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M3 12v-2m0 2l2.26-2.26M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16m18-4v2m0-2l-2.26 2.26" />
          </svg>
          Alapértelmezések visszaállítása
        </button>
      </div>

      <!-- Hidden file input -->
      <input
        bind:this={fileInput}
        type="file"
        accept=".json"
        onchange={handleFileSelect}
        style="display: none"
      />

      <!-- Import/Export Messages -->
      {#if importMessage}
        <div class="message message--success">{importMessage}</div>
      {/if}
      {#if importError}
        <div class="message message--error">{importError}</div>
      {/if}
    </section>

    <!-- App Info -->
    <section class="settings-section">
      <h2 class="section-title">Információ</h2>
      <div class="info-group">
        <p class="info-item">
          <span class="info-label">Verzió:</span>
          <span class="info-value">1.0.0</span>
        </p>
        <p class="info-item">
          <span class="info-label">Build:</span>
          <span class="info-value">PWA</span>
        </p>
      </div>
    </section>
  </div>
</div>

<style>
  .settings-page {
    min-height: 100vh;
    background: var(--bg-secondary);
    padding-bottom: var(--space-10);
    padding-top: 80px;
  }

  .settings-header {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-5) var(--space-4);
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-light);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
  }

  /* Dark mode glass effect for settings header */
  :global([data-theme="dark"]) .settings-header {
    background: rgba(28, 28, 30, 0.7);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .back-button {
    background: none;
    border: none;
    color: var(--color-info);
    cursor: pointer;
    padding: var(--space-2);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: background 200ms ease;
  }

  .back-button:hover {
    background: var(--bg-tertiary);
  }

  .settings-header h1 {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  .settings-container {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--space-4);
  }

  .settings-section {
    background: var(--bg-primary);
    border-radius: 20px;
    padding: var(--space-6);
    margin-bottom: var(--space-4);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 4px 8px rgba(0, 0, 0, 0.06);
  }

  :global([data-theme="dark"]) .settings-section {
    background: #293F3F;
  }

  .section-title {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-5);
  }

  .setting-group {
    margin-bottom: var(--space-5);
  }

  .setting-group:last-child {
    margin-bottom: 0;
  }

  .setting-label {
    display: block;
    font-size: var(--text-base);
    font-weight: var(--font-medium);
    color: var(--text-primary);
    margin-bottom: var(--space-3);
  }

  .color-picker {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .color-option {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 3px solid transparent;
    cursor: pointer;
    transition: all 200ms ease;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .color-option:hover {
    transform: scale(1.1);
  }

  .color-option.selected {
    border-color: var(--text-primary);
    transform: scale(1.15);
  }

  .checkmark {
    color: var(--text-primary);
    font-size: 20px;
    font-weight: bold;
    text-shadow:
      0 0 3px white,
      0 0 6px white;
  }

  /* Action Buttons */
  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-4);
    border: 2px solid var(--border-light);
    border-radius: 12px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: var(--text-base);
    font-weight: var(--font-medium);
    cursor: pointer;
    transition: all 200ms ease;
  }

  .action-button:hover:not(:disabled) {
    border-color: var(--color-info);
    background: var(--color-info);
    color: white;
  }

  .action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-button--danger {
    border-color: var(--color-error);
    color: var(--color-error);
  }

  .action-button--danger:hover:not(:disabled) {
    background: var(--color-error);
    color: white;
  }

  /* Messages */
  .message {
    margin-top: var(--space-4);
    padding: var(--space-3) var(--space-4);
    border-radius: 12px;
    font-size: var(--text-sm);
    animation: slideUp 300ms ease;
  }

  .message--success {
    background: var(--color-success);
    color: white;
  }

  .message--error {
    background: var(--color-error);
    color: white;
  }

  /* Info */
  .info-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-base);
  }

  .info-label {
    color: var(--text-secondary);
  }

  .info-value {
    color: var(--text-primary);
    font-weight: var(--font-medium);
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Responsive */
  @media (max-width: 375px) {
    .settings-container {
      padding: var(--space-3);
    }

    .settings-section {
      padding: var(--space-4);
    }

    .color-option {
      width: 40px;
      height: 40px;
    }
  }

  @media (max-width: 640px) {
    .settings-page {
      padding-top: 75px;
    }
  }

  @media (max-width: 375px) {
    .settings-page {
      padding-top: 70px;
    }
  }

  @media (min-width: 640px) {
    .action-buttons {
      flex-direction: row;
    }

    .action-button {
      flex: 1;
    }
  }
</style>

<script lang="ts">
  /**
   * Settings Page
   * User preferences and data management
   */

  import { onMount } from 'svelte';
  import { router } from 'tinro';
  import { settingsStore } from '$lib/stores/settings';
  import { themeStore } from '$lib/stores/theme';
  import { exportData, downloadJSON, readFileAsText, validateImportData, importData, type ImportStrategy } from '$lib/utils/export';
  import type { Theme, FontSize } from '$lib/types';
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

  // Theme options
  const themeOptions: { value: Theme; label: string }[] = [
    { value: 'light', label: 'Világos' },
    { value: 'dark', label: 'Sötét' },
    { value: 'auto', label: 'Automatikus' },
  ];

  // Font size options
  const fontSizeOptions: { value: FontSize; label: string; description: string }[] = [
    { value: 'small', label: 'Kicsi', description: '14px' },
    { value: 'medium', label: 'Közepes', description: '16px' },
    { value: 'large', label: 'Nagy', description: '18px' },
  ];

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
  async function handleThemeChange(theme: Theme) {
    await themeStore.set(theme);
  }

  async function handleFontSizeChange(fontSize: FontSize) {
    await settingsStore.update({ fontSize });
    // Apply font size immediately
    document.documentElement.style.setProperty('--text-base', fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px');
  }

  async function handleAnimationsToggle() {
    await settingsStore.update({ enableAnimations: !$settingsStore.enableAnimations });
  }

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
      await themeStore.init();
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
    <!-- Theme Settings -->
    <section class="settings-section">
      <h2 class="section-title">Megjelenés</h2>

      <div class="setting-group">
        <label class="setting-label">Téma</label>
        <div class="theme-options">
          {#each themeOptions as option}
            <button
              class="theme-option"
              class:active={$settingsStore.theme === option.value}
              onclick={() => handleThemeChange(option.value)}
            >
              {option.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="setting-group">
        <label class="setting-label">Betűméret</label>
        <div class="font-size-options">
          {#each fontSizeOptions as option}
            <button
              class="font-size-option"
              class:active={$settingsStore.fontSize === option.value}
              onclick={() => handleFontSizeChange(option.value)}
            >
              <span class="font-size-label">{option.label}</span>
              <span class="font-size-description">{option.description}</span>
            </button>
          {/each}
        </div>
      </div>

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

      <div class="setting-group">
        <label class="setting-item">
          <span class="setting-label">Animációk</span>
          <label class="toggle">
            <input
              type="checkbox"
              checked={$settingsStore.enableAnimations}
              onchange={handleAnimationsToggle}
            />
            <span class="toggle-slider"></span>
          </label>
        </label>
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
  }

  .settings-header {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-5) var(--space-4);
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-light);
    position: sticky;
    top: 0;
    z-index: 10;
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

  .theme-options,
  .font-size-options {
    display: flex;
    gap: var(--space-2);
  }

  .theme-option,
  .font-size-option {
    flex: 1;
    padding: var(--space-3) var(--space-4);
    border: 2px solid var(--border-light);
    border-radius: 12px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: var(--text-base);
    font-weight: var(--font-medium);
    cursor: pointer;
    transition: all 200ms ease;
  }

  .theme-option:hover,
  .font-size-option:hover {
    border-color: var(--color-info);
    transform: translateY(-1px);
  }

  .theme-option.active,
  .font-size-option.active {
    border-color: var(--color-info);
    background: var(--color-info);
    color: white;
  }

  .font-size-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
  }

  .font-size-description {
    font-size: var(--text-xs);
    opacity: 0.7;
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

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  /* Toggle Switch */
  .toggle {
    position: relative;
    display: inline-block;
    width: 52px;
    height: 28px;
  }

  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--bg-tertiary);
    transition: 0.3s;
    border-radius: 34px;
  }

  .toggle-slider:before {
    position: absolute;
    content: '';
    height: 22px;
    width: 22px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }

  .toggle input:checked + .toggle-slider {
    background-color: var(--color-success);
  }

  .toggle input:checked + .toggle-slider:before {
    transform: translateX(24px);
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
  @media (min-width: 640px) {
    .action-buttons {
      flex-direction: row;
    }

    .action-button {
      flex: 1;
    }
  }
</style>

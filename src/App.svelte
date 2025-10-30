<script lang="ts">
  // Temporary placeholder for Phase 1 testing
  let message = $state('Notizz PWA - Fázis 1 teszt');
</script>

<main class="app-container">
  <h1>{message}</h1>
  <p>Az alkalmazás inicializálása sikeres!</p>
</main>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: var(--space-4);
  }

  h1 {
    font-size: var(--text-xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin-bottom: var(--space-4);
  }

  p {
    font-size: var(--text-base);
    color: var(--text-secondary);
  }
</style>

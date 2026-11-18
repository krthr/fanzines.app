<script setup lang="ts">
// Shared by the editor top bar and the prerendered fallback in pages/editor.vue,
// so the static HTML and the hydrated editor show the same H1 and home link.
// Its styles live in main.css for the same reason.
</script>

<template>
  <div class="ed-brand">
    <NuxtLink to="/" class="ed-brand-mark" aria-label="Fanzines inicio">
      <UIcon class="ed-brand-icon" name="i-lucide-scissors" aria-hidden="true" />
    </NuxtLink>
    <div class="ed-brand-text">
      <h1 class="ed-brand-name">
        Editor de fanzines
      </h1>
      <p class="ed-brand-status">
        Pliego A4 · 8 páginas
      </p>
    </div>
  </div>
</template>

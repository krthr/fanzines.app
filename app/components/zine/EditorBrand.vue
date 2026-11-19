<script setup lang="ts">
// Shared by the editor top bar and the prerendered fallback in pages/editor.vue,
// so the static HTML and the hydrated editor show the same H1 and home link.
// Its styles live in main.css for the same reason.
const { t } = useI18n()
</script>

<template>
  <div class="ed-brand">
    <NuxtLinkLocale to="/" class="ed-brand-mark" :aria-label="t('app.homeLabel')">
      <UIcon class="ed-brand-icon" name="i-lucide-scissors" aria-hidden="true" />
    </NuxtLinkLocale>
    <div class="ed-brand-text">
      <h1 class="ed-brand-name">
        {{ t('editor.brand.title') }}
      </h1>
      <p class="ed-brand-status">
        {{ t('editor.brand.status') }}
      </p>
    </div>
  </div>
</template>

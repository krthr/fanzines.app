<script setup lang="ts">
// Shared by the editor header and the prerendered fallback in pages/editor.vue,
// so the static HTML and the hydrated editor show the same H1 and home link.
defineProps<{ subtitle: string }>()
</script>

<template>
  <div class="flex min-w-0 items-center gap-3">
    <NuxtLink to="/" class="zine-editor-mark grid size-10 place-items-center" aria-label="Fanzines inicio">
      <UIcon class="zine-editor-mark-icon" name="i-lucide-scissors" aria-hidden="true" />
    </NuxtLink>
    <div class="min-w-0">
      <h1 class="m-0 truncate text-base font-semibold leading-5 text-default">
        Editor de fanzines
      </h1>
      <p class="truncate text-xs text-muted">
        {{ subtitle }}
      </p>
    </div>
  </div>
</template>

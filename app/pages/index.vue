<script setup lang="ts">
import ZineEditor from '~/components/zine/ZineEditor.client.vue'
</script>

<template>
  <ClientOnly>
    <ZineEditor />
    <template #fallback>
      <main class="min-h-dvh bg-default p-6 text-sm text-muted">
        Cargando editor...
      </main>
    </template>
  </ClientOnly>
</template>

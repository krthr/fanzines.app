<script setup lang="ts">
import ZineEditor from '~/components/zine/ZineEditor.client.vue'

useHead({
  title: 'Editor de fanzines | Fanzines',
  meta: [
    {
      name: 'description',
      content: 'Editor de Fanzines para diseñar ocho paneles, revisar el pliego A4 y exportar un PDF listo para imprimir.'
    }
  ]
})
</script>

<template>
  <ClientOnly>
    <ZineEditor />
    <template #fallback>
      <main class="min-h-dvh bg-default p-6 text-sm text-muted">
        Cargando editor.
      </main>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import ZineEditor from '~/components/zine/ZineEditor.client.vue'

const siteUrl = 'https://fanzines.app'
const pageUrl = `${siteUrl}/editor`
const pageTitle = 'Editor de fanzines A4'
const socialTitle = 'Editor de fanzines A4 | Fanzines'
const pageDescription =
  'Diseña un fanzine de ocho paneles en el navegador, revisa el pliego A4 y exporta un PDF listo para imprimir y doblar.'
const socialImage = `${siteUrl}/images/og-fanzines.webp`

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  robots: 'index, follow',
  ogTitle: socialTitle,
  ogDescription: pageDescription,
  ogType: 'website',
  ogUrl: pageUrl,
  ogSiteName: 'Fanzines',
  ogImage: socialImage,
  ogImageAlt: 'Editor de Fanzines con pliego A4 y paneles de fanzine',
  twitterCard: 'summary_large_image',
  twitterTitle: socialTitle,
  twitterDescription: pageDescription,
  twitterImage: socialImage
})

useHead({
  link: [
    { rel: 'canonical', href: pageUrl }
  ]
})
</script>

<template>
  <main class="editor-page">
    <ClientOnly>
      <ZineEditor />
      <template #fallback>
        <section class="editor-loading" aria-label="Cargando editor">
          Cargando editor.
        </section>
      </template>
    </ClientOnly>
  </main>
</template>

<style scoped>
.editor-page {
  position: relative;
  min-width: 320px;
  min-height: 100dvh;
  background: var(--zine-paper);
  color: var(--zine-ink);
}

.editor-loading {
  min-height: 60dvh;
  padding: 24px;
  color: var(--zine-muted);
  font-size: 0.95rem;
}

</style>

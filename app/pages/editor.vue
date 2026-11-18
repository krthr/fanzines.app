<script setup lang="ts">
import EditorBrand from '~/components/zine/EditorBrand.vue'
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
        <div>
          <header class="zine-editor-header flex h-auto min-h-16 flex-wrap items-center gap-3 px-3 py-2 lg:h-16 lg:px-4">
            <EditorBrand subtitle="Pliego A4" />
          </header>
          <section class="editor-loading px-3 py-5 lg:px-4">
            <p>
              {{ pageDescription }} Es gratis y no necesitas cuenta.
            </p>
            <p class="editor-loading-meta">
              <span>Cargando editor…</span>
              <NuxtLink to="/">Ver cómo funciona Fanzines</NuxtLink>
            </p>
          </section>
        </div>
      </template>
    </ClientOnly>
  </main>
</template>

<style scoped>
.editor-page {
  position: relative;
  min-width: 320px;
  min-height: 100dvh;
  overflow: hidden;
  background:
    linear-gradient(rgb(255 255 255 / 5%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 4%) 1px, transparent 1px),
    var(--zine-bg);
  background-size: 24px 24px;
  color: var(--zine-paper);
  font-family: Outfit, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.editor-loading {
  max-width: 40rem;
  color: rgb(238 232 216 / 82%);
  font-size: 0.95rem;
  line-height: 1.5;
}

.editor-loading-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin-top: 12px;
  color: rgb(238 232 216 / 60%);
  font-size: 0.85rem;
}

.editor-loading-meta a {
  color: var(--zine-accent);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.editor-loading-meta a:focus-visible {
  outline: 2px solid var(--zine-accent);
  outline-offset: 2px;
}

</style>

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
          <header class="ed-topbar">
            <EditorBrand />
          </header>
          <section class="editor-loading">
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
  min-width: 320px;
  min-height: 100dvh;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
}

.editor-loading {
  max-width: 40rem;
  padding: 20px;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.5;
}

.editor-loading-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin-top: 12px;
  font-size: 14px;
}

.editor-loading-meta a {
  color: var(--acid);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.editor-loading-meta a:focus-visible {
  outline: 2px solid var(--acid);
  outline-offset: 2px;
}

@media (max-width: 1023.98px) {
  .editor-loading {
    padding: 16px 12px;
  }
}
</style>

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
    <section class="editor-intro" aria-labelledby="editor-title">
      <NuxtLink class="editor-brand" to="/" aria-label="Fanzines inicio">
        Fanzines
      </NuxtLink>
      <div>
        <p class="editor-kicker">
          Editor A4 en línea
        </p>
        <h1 id="editor-title">
          Editor de fanzines para imprimir y doblar.
        </h1>
        <p class="editor-summary">
          Crea ocho paneles, coloca textos e imágenes, revisa el pliego completo y descarga un PDF
          preparado para una hoja A4.
        </p>
      </div>
    </section>

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
  min-width: 320px;
  min-height: 100dvh;
  background: var(--zine-paper);
  color: var(--zine-ink);
}

.editor-intro {
  display: grid;
  grid-template-columns: minmax(120px, 0.18fr) minmax(0, 1fr);
  gap: clamp(20px, 4vw, 48px);
  width: min(1180px, calc(100% - 36px));
  margin-inline: auto;
  padding: clamp(22px, 4vw, 42px) 0 clamp(18px, 3vw, 30px);
}

.editor-brand {
  color: inherit;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0;
  text-decoration: none;
  text-transform: uppercase;
}

.editor-brand:focus-visible {
  outline: 3px solid var(--zine-accent);
  outline-offset: 4px;
}

.editor-kicker {
  margin: 0 0 10px;
  color: var(--zine-accent-strong);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.editor-intro h1 {
  max-width: 860px;
  margin: 0;
  font-size: clamp(2.3rem, 6vw, 5rem);
  font-weight: 850;
  letter-spacing: 0;
  line-height: 0.94;
}

.editor-summary {
  max-width: 720px;
  margin: 18px 0 0;
  color: var(--zine-muted);
  font-size: clamp(1rem, 1.8vw, 1.22rem);
  line-height: 1.55;
}

.editor-loading {
  min-height: 60dvh;
  padding: 24px;
  color: var(--zine-muted);
  font-size: 0.95rem;
}

@media (max-width: 720px) {
  .editor-intro {
    grid-template-columns: 1fr;
  }
}
</style>

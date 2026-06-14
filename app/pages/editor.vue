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
    <details class="editor-info">
      <summary aria-label="Información">
        <span class="editor-info-icon" aria-hidden="true">i</span>
        <span class="editor-info-label">Información</span>
      </summary>
      <section class="editor-info-panel" aria-labelledby="editor-title">
        <h1 id="editor-title">
          Editor de fanzines para imprimir y doblar.
        </h1>
        <p>
          Crea ocho paneles, coloca textos e imágenes, revisa el pliego completo y descarga un PDF
          preparado para una hoja A4.
        </p>
      </section>
    </details>

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
  overflow: hidden;
  background:
    linear-gradient(rgb(255 255 255 / 5%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 4%) 1px, transparent 1px),
    var(--zine-bg);
  background-size: 24px 24px;
  color: var(--zine-paper);
  font-family: Outfit, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.editor-info {
  position: absolute;
  top: 78px;
  right: clamp(350px, 25vw, 460px);
  z-index: 30;
  width: max-content;
  max-width: min(420px, calc(100% - 24px));
  color: var(--zine-paper);
}

.editor-info[open] {
  width: min(420px, calc(100% - 24px));
}

.editor-info summary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 12px;
  border: 2px solid var(--zine-paper);
  border-radius: 0;
  background: var(--zine-accent);
  box-shadow: 5px 5px 0 rgb(0 0 0 / 92%);
  color: var(--zine-ink);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 900;
  list-style: none;
  text-transform: uppercase;
}

.editor-info summary::-webkit-details-marker {
  display: none;
}

.editor-info summary:focus-visible {
  outline: 3px solid var(--zine-accent);
  outline-offset: 3px;
}

.editor-info-icon {
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  border: 1px solid currentcolor;
  border-radius: 0;
  color: var(--zine-ink);
  font-size: 0.78rem;
  font-weight: 900;
  line-height: 1;
}

.editor-info-panel {
  margin-top: 8px;
  padding: 16px 18px;
  border: 2px solid var(--zine-ink);
  border-radius: 0;
  background: var(--zine-paper);
  box-shadow: 8px 8px 0 rgb(0 0 0 / 92%);
  color: var(--zine-ink);
}

.editor-info-panel h1 {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 900;
  line-height: 1.05;
  text-transform: uppercase;
}

.editor-info-panel p {
  margin: 8px 0 0;
  color: var(--zine-muted);
  font-size: 0.92rem;
  line-height: 1.5;
}

.editor-loading {
  min-height: 60dvh;
  padding: 24px;
  color: rgb(238 232 216 / 72%);
  font-size: 0.95rem;
}

@media (max-width: 1023px) {
  .editor-info {
    top: 74px;
    right: 12px;
  }
}

@media (max-width: 720px) {
  .editor-info {
    top: 12px;
    right: 12px;
    left: auto;
    width: max-content;
    max-width: calc(100% - 24px);
  }

  .editor-info[open] {
    left: 12px;
    width: calc(100% - 24px);
  }

  .editor-info-label {
    display: none;
  }

  .editor-info-panel {
    max-height: calc(100dvh - 92px);
    overflow: auto;
  }
}

</style>

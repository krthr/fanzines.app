<script setup lang="ts">
import EditorBrand from '~/components/zine/EditorBrand.vue'
import ZineEditor from '~/components/zine/ZineEditor.client.vue'

const { t } = useI18n()
const localizedImage = useLocalizedImage()

const socialImage = () => localizedImage('https://fanzines.app/images/og-fanzines.webp')
const socialTitle = () => `${t('editorPage.seo.title')} | Fanzines`

// The canonical URL, og:url and the hreflang alternates come from useLocaleHead in app.vue.
useSeoMeta({
  title: () => t('editorPage.seo.title'),
  description: () => t('editorPage.seo.description'),
  robots: 'index, follow',
  ogTitle: socialTitle,
  ogDescription: () => t('editorPage.seo.description'),
  ogType: 'website',
  ogSiteName: 'Fanzines',
  ogImage: socialImage,
  ogImageAlt: () => t('editorPage.seo.imageAlt'),
  twitterCard: 'summary_large_image',
  twitterTitle: socialTitle,
  twitterDescription: () => t('editorPage.seo.description'),
  twitterImage: socialImage
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
              {{ t('editorPage.seo.description') }} {{ t('editorPage.free') }}
            </p>
            <p class="editor-loading-meta">
              <span>{{ t('editorPage.loading') }}</span>
              <NuxtLinkLocale to="/">{{ t('editorPage.howItWorks') }}</NuxtLinkLocale>
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

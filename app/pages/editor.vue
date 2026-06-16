<script setup lang="ts">
import { computed } from 'vue'
import ZineEditor from '~/components/zine/ZineEditor.client.vue'

const siteUrl = 'https://fanzines.app'
const socialImage = `${siteUrl}/images/og-fanzines.webp`
const { t } = useI18n()
const route = useRoute()
const pageUrl = computed(() => new URL(route.path, siteUrl).href)

useSeoMeta({
  title: () => t('editorPage.seo.title'),
  description: () => t('editorPage.seo.description'),
  robots: 'index, follow',
  ogTitle: () => t('editorPage.seo.socialTitle'),
  ogDescription: () => t('editorPage.seo.description'),
  ogType: 'website',
  ogUrl: () => pageUrl.value,
  ogSiteName: 'Fanzines',
  ogImage: socialImage,
  ogImageAlt: () => t('editorPage.seo.imageAlt'),
  twitterCard: 'summary_large_image',
  twitterTitle: () => t('editorPage.seo.socialTitle'),
  twitterDescription: () => t('editorPage.seo.description'),
  twitterImage: socialImage
})
</script>

<template>
  <main class="editor-page">
    <ClientOnly>
      <ZineEditor />
      <template #fallback>
        <section class="editor-loading" :aria-label="t('editorPage.loadingAria')">
          {{ t('editorPage.loading') }}
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

.editor-loading {
  min-height: 60dvh;
  padding: 24px;
  color: rgb(238 232 216 / 72%);
  font-size: 0.95rem;
}

</style>

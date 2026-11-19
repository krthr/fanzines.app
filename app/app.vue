<script setup lang="ts">
const siteUrl = 'https://fanzines.app'
const ogImage = `${siteUrl}/images/og-fanzines.webp`
const author = {
  '@type': 'Person',
  name: 'Wilson Tovar',
  url: 'https://krthr.co',
  sameAs: [
    'https://krthr.co',
    'https://www.instagram.com/wilson__tovar/'
  ]
} as const

const { t, localeProperties } = useI18n()

// <html lang>, the canonical URL, og:url, og:locale and one hreflang alternate per language.
const localeHead = useLocaleHead()

useHead(() => ({
  htmlAttrs: localeHead.value.htmlAttrs,
  link: localeHead.value.link,
  meta: localeHead.value.meta,
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Fanzines',
        url: siteUrl,
        image: ogImage,
        author,
        creator: author,
        copyrightHolder: author,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Web',
        inLanguage: localeProperties.value.language,
        description: t('app.description')
      })
    }
  ]
}))
</script>

<template>
  <!-- Nuxt UI follows the i18n locale by itself for its own labels (a toast's close button). -->
  <UApp :toaster="{ progress: false }">
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </UApp>
</template>

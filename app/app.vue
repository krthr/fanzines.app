<script setup lang="ts">
import { computed } from 'vue'

const siteUrl = 'https://fanzines.app'
const ogImage = `${siteUrl}/images/og-fanzines.webp`
const localeLanguages: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  'pt-br': 'pt-BR'
}

const { locale, t } = useI18n()
const i18nHead = useLocaleHead({ seo: true })
const currentLanguage = computed(() => localeLanguages[locale.value] ?? 'en-US')

useHead(() => ({
  htmlAttrs: {
    ...i18nHead.value.htmlAttrs
  },
  link: i18nHead.value.link,
  meta: i18nHead.value.meta,
  script: [
    {
      key: 'schema-org-web-application',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Fanzines',
        url: siteUrl,
        image: ogImage,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Web',
        inLanguage: currentLanguage.value,
        description: t('seo.appDescription')
      })
    }
  ]
}))
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </UApp>
</template>

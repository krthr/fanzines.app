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

useHead({
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
        inLanguage: 'es',
        description:
          'Editor en el navegador para diseñar ocho paneles de un fanzine A4 plegable y exportarlo como PDF listo para imprimir.'
      })
    }
  ]
})
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </UApp>
</template>

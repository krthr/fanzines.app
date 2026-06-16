<script setup lang="ts">
const siteUrl = "https://fanzines.app";
const ogImage = `${siteUrl}/images/og-fanzines.webp`;

useHead({
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Fanzines",
        url: siteUrl,
        image: ogImage,
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        inLanguage: "es",
        description:
          "Editor en el navegador para diseñar ocho paneles de un fanzine A4 plegable y exportarlo como PDF listo para imprimir.",
      }),
    },
  ],
});
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </UApp>
</template>

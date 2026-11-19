<script setup lang="ts">
// A link to the page you are on in the other language. With two locales a menu would
// hold a single option, so the link is named after the language it leads to.
defineProps<{
  // The language code ("EN") instead of its name, for bars that are short of room.
  short?: boolean
}>()

const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const other = computed(() => locales.value.find((item) => item.code !== locale.value))
</script>

<template>
  <NuxtLink
    v-if="other"
    :to="switchLocalePath(other.code)"
    :hreflang="other.language"
    :lang="other.language"
    :aria-label="short ? other.name : undefined"
    :title="short ? other.name : undefined"
  >
    {{ short ? other.code.toUpperCase() : other.name }}
  </NuxtLink>
</template>

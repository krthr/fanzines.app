<script setup lang="ts">
import { computed } from 'vue'

type LocaleItem = {
  code: string
  language?: string
  name?: string
}

const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const localeItems = computed(() => (locales.value as LocaleItem[]).map((item) => ({
  ...item,
  label: item.code === 'pt-br' ? 'PT-BR' : item.code.toUpperCase()
})))
</script>

<template>
  <div class="locale-switcher" role="group" :aria-label="$t('localeSwitcher.label')">
    <NuxtLink
      v-for="item in localeItems"
      :key="item.code"
      class="locale-switcher-link"
      :class="{ 'locale-switcher-link-active': item.code === locale }"
      :to="switchLocalePath(item.code)"
      :lang="item.language"
      :aria-current="item.code === locale ? 'page' : undefined"
    >
      {{ item.label }}
    </NuxtLink>
  </div>
</template>

<style scoped>
.locale-switcher {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border: 1px solid rgb(238 232 216 / 34%);
  background: rgb(238 232 216 / 6%);
}

.locale-switcher-link {
  display: inline-flex;
  min-height: 30px;
  min-width: 42px;
  align-items: center;
  justify-content: center;
  padding: 0 9px;
  color: currentcolor;
  font-size: 0.75rem;
  font-weight: 900;
  line-height: 1;
  text-decoration: none;
  text-transform: uppercase;
}

.locale-switcher-link:hover,
.locale-switcher-link-active {
  background: var(--zine-accent);
  color: var(--zine-ink);
}

.locale-switcher-link:focus-visible {
  outline: 3px solid var(--zine-accent);
  outline-offset: 2px;
}
</style>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error.status === 404)

const copy = computed(() =>
  isNotFound.value
    ? {
        tag: 'Error 404 · página perdida',
        title: ['Esta página ', 'no existe.'],
        text: 'Quizá el enlace está mal escrito o la página se quedó fuera del pliego. Vuelve al inicio o empieza tu propio fanzine.',
        headTitle: 'Página no encontrada | Fanzines'
      }
    : {
        tag: `Error ${props.error.status || 500}`,
        title: ['Algo salió ', 'mal.'],
        text: 'No pudimos cargar esta página. Inténtalo de nuevo en un momento, vuelve al inicio o empieza un fanzine.',
        headTitle: 'Algo salió mal | Fanzines'
      }
)

// nuxt-robots skips the internal /__nuxt_error render (and useRobotsRule throws there),
// so set noindex here. Nuxt copies this render's headers onto the real error response.
const robots = 'noindex, nofollow'
useSeoMeta({ title: () => copy.value.headTitle, robots })
if (import.meta.server) {
  useResponseHeader('X-Robots-Tag').value = robots
}

// Real hrefs keep the links crawlable and working without JS; plain clicks clear the error in place.
function leave(event: MouseEvent, redirect: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  clearError({ redirect })
}
</script>

<template>
  <div class="error-page">
    <header class="site-header band">
      <a class="brand" href="/" aria-label="Fanzines inicio" @click="leave($event, '/')">
        <UIcon class="brand-icon" name="i-lucide-scissors" aria-hidden="true" />
        <span>Fanzines</span>
      </a>
    </header>

    <main class="error-main band">
      <p class="error-tag">{{ copy.tag }}</p>
      <h1 class="display error-title">
        <span v-for="line in copy.title" :key="line">{{ line }}</span>
      </h1>
      <p class="error-text">{{ copy.text }}</p>
      <div class="error-actions">
        <a class="button button-primary" href="/editor" @click="leave($event, '/editor')">
          Crear un fanzine
          <UIcon class="button-icon" name="i-lucide-arrow-right" aria-hidden="true" />
        </a>
        <a class="button button-paper" href="/" @click="leave($event, '/')">Volver al inicio</a>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Tokens and button styles mirror app/pages/index.vue. */
.error-page {
  --bg: #0b0a09;
  --ink: #ede7da;
  --muted: #a8a196;
  --orange: #d25a36;
  --orange-deep: #8e3a22;
  --acid: #e9ff5c;
  --ink-dark: #0b0a09;
  --font-display: Anton, Impact, "Arial Narrow Bold", sans-serif;
  --font-body: Outfit, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-type: "Special Elite", "Courier New", monospace;
  --content: 1200px;
  --gutter: 48px;
  display: flex;
  flex-direction: column;
  min-width: 320px;
  min-height: 100dvh;
  overflow-x: clip;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
}

.error-page a:focus-visible {
  outline: 3px solid var(--acid);
  outline-offset: 4px;
}

.band {
  padding-inline: max(var(--gutter), calc((100% - var(--content)) / 2));
}

.display {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  letter-spacing: 0;
  text-transform: uppercase;
}

.display span {
  display: block;
}

.site-header {
  padding-block: 28px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-display);
  font-size: 22px;
  letter-spacing: 1px;
  line-height: 1.5;
  text-transform: uppercase;
}

.brand-icon {
  width: 20px;
  height: 20px;
  color: var(--orange);
}

.error-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 32px;
  padding-block: 48px 96px;
}

.error-tag {
  margin: 0;
  padding: 6px 12px;
  background: var(--acid);
  color: var(--ink-dark);
  font-family: var(--font-type);
  font-size: 15px;
  line-height: 1.2;
  transform: rotate(-2deg);
}

.error-title {
  font-size: clamp(3.5rem, 9vw, 6.5rem);
  line-height: 0.95;
}

.error-text {
  max-width: 520px;
  margin: 0;
  color: var(--muted);
  font-size: 20px;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
}

.button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 18px 28px;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.25;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.button:hover {
  transform: translate(-3px, -3px);
  box-shadow: 4px 4px 0 var(--orange-deep);
}

.button:active {
  transform: translate(0, 0);
  box-shadow: 0 0 0 var(--orange-deep);
}

.button-icon {
  width: 18px;
  height: 18px;
}

.button-primary {
  background: var(--orange);
  color: var(--ink-dark);
}

.button-paper {
  background: var(--ink);
  color: var(--ink-dark);
}

@media (max-width: 760px) {
  .error-page {
    --gutter: 18px;
  }

  .site-header {
    padding-block: 20px;
  }

  .error-main {
    gap: 28px;
    padding-block: 24px 72px;
  }

  .error-text {
    font-size: 18px;
  }

  .error-actions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }

  .button {
    justify-content: center;
  }
}
</style>

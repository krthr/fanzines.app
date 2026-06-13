<script setup>
const title = ref('Una historia sin final')
const tone = ref('photo')
const format = ref('mini')

useHead({
  title: 'Editor | Fanzines',
  meta: [
    {
      name: 'description',
      content:
        'Editor sencillo de Fanzines para montar una primera maqueta con título, tono y formato.'
    }
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Special+Elite&display=swap'
    }
  ]
})

const tones = [
  { id: 'photo', label: 'Foto diario', accent: '#ff4c2e', image: '/images/hand-zine.webp' },
  { id: 'fold', label: 'Pliegue', accent: '#d8ff42', image: '/images/folded-zine.webp' },
  { id: 'cut', label: 'Mesa de corte', accent: '#8fc7ff', image: '/images/making-table.webp' }
]

const formats = [
  { id: 'mini', label: 'Mini 8 páginas', note: 'A4, un corte, bolsillo' },
  { id: 'spread', label: 'Doble página', note: 'Más visual, menos texto' },
  { id: 'poster', label: 'Póster plegado', note: 'Una imagen grande al abrir' }
]

const currentTone = computed(() => tones.find((item) => item.id === tone.value) || tones[0])
const currentFormat = computed(() => formats.find((item) => item.id === format.value) || formats[0])
const cleanTitle = computed(() => title.value.trim() || 'Fanzine sin título')
</script>

<template>
  <main class="editor-page" :style="{ '--accent': currentTone.accent }">
    <header class="editor-header">
      <NuxtLink class="brand" to="/">Fanzines</NuxtLink>
      <nav aria-label="Navegación del editor">
        <NuxtLink to="/">Landing</NuxtLink>
        <a href="https://beta.fanzines.app">beta.fanzines.app</a>
      </nav>
    </header>

    <section class="editor-shell" aria-labelledby="editor-title">
      <div class="controls">
        <h1 id="editor-title">Editor de primer pliegue</h1>
        <p>
          Una maqueta rápida para decidir el título, el tono visual y el formato antes de imprimir o
          compartir.
        </p>

        <label class="field">
          <span>Título</span>
          <input v-model="title" maxlength="44" type="text" />
        </label>

        <fieldset>
          <legend>Tono</legend>
          <div class="option-grid">
            <button
              v-for="item in tones"
              :key="item.id"
              class="option-button"
              :class="{ active: item.id === tone }"
              type="button"
              @click="tone = item.id"
            >
              {{ item.label }}
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>Formato</legend>
          <div class="option-grid">
            <button
              v-for="item in formats"
              :key="item.id"
              class="option-button"
              :class="{ active: item.id === format }"
              type="button"
              @click="format = item.id"
            >
              {{ item.label }}
            </button>
          </div>
        </fieldset>
      </div>

      <section class="preview-area" aria-label="Previsualización del fanzine">
        <article class="zine-cover">
          <div class="cover-image" :style="{ backgroundImage: `url(${currentTone.image})` }" />
          <div class="cover-copy">
            <span>{{ currentFormat.label }}</span>
            <h2>{{ cleanTitle }}</h2>
            <p>{{ currentFormat.note }}</p>
          </div>
        </article>

        <div class="fold-sheet" aria-hidden="true">
          <span v-for="page in 8" :key="page">{{ page }}</span>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(html) {
  background: #f6f0df;
}

:global(body) {
  margin: 0;
  min-width: 320px;
  background:
    linear-gradient(rgba(20, 18, 15, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(20, 18, 15, 0.025) 1px, transparent 1px),
    #f6f0df;
  background-size: 26px 26px;
  color: #14120f;
  font-family: 'Special Elite', 'Courier New', monospace;
}

:global(a) {
  color: inherit;
  text-decoration: none;
}

:global(button),
:global(input) {
  font: inherit;
}

.editor-page {
  min-height: 100vh;
  overflow-x: hidden;
}

.editor-header,
.editor-shell {
  width: min(1180px, calc(100% - 36px));
  margin-inline: auto;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  padding: 22px 0;
}

.brand {
  font-family: 'Patrick Hand', 'Comic Sans MS', cursive;
  font-size: clamp(1.65rem, 3vw, 2.2rem);
  transform: rotate(-2deg);
}

.editor-header nav {
  display: flex;
  gap: clamp(12px, 2.4vw, 28px);
  font-size: 0.94rem;
}

.editor-header a:hover {
  text-decoration-line: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 5px;
}

.editor-shell {
  display: grid;
  grid-template-columns: minmax(280px, 0.48fr) minmax(360px, 0.72fr);
  gap: clamp(26px, 5vw, 72px);
  align-items: start;
  padding: 36px 0 70px;
}

.controls {
  padding: clamp(20px, 3vw, 34px);
  border: 2px solid #14120f;
  background: #fffaf0;
  box-shadow: 8px 8px 0 #14120f;
}

.controls h1 {
  margin: 0;
  font-family: Impact, 'Arial Black', sans-serif;
  font-size: clamp(2.6rem, 5vw, 5rem);
  line-height: 0.9;
  letter-spacing: 0;
  text-transform: uppercase;
}

.controls p {
  margin: 22px 0 0;
  font-size: 1.02rem;
  line-height: 1.55;
}

.field,
fieldset {
  display: grid;
  gap: 10px;
  margin: 26px 0 0;
  padding: 0;
  border: 0;
}

.field span,
legend {
  font-family: 'Patrick Hand', 'Comic Sans MS', cursive;
  font-size: 1.3rem;
}

input {
  width: 100%;
  min-height: 50px;
  padding: 0 14px;
  border: 2px solid #14120f;
  background: #f6f0df;
  color: #14120f;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.option-button {
  min-height: 46px;
  border: 2px solid #14120f;
  background: #f6f0df;
  color: #14120f;
  cursor: pointer;
}

.option-button.active,
.option-button:hover {
  background: var(--accent);
}

.preview-area {
  display: grid;
  grid-template-columns: minmax(240px, 0.7fr) minmax(220px, 0.52fr);
  gap: clamp(18px, 3vw, 34px);
  align-items: center;
}

.zine-cover {
  overflow: hidden;
  border: 2px solid #14120f;
  background: #fffaf0;
  box-shadow: 10px 12px 0 #14120f;
  transform: rotate(1.5deg);
}

.cover-image {
  min-height: clamp(290px, 42vw, 520px);
  background-position: center;
  background-size: cover;
  filter: saturate(0.92) contrast(1.08);
}

.cover-copy {
  padding: 20px;
}

.cover-copy span {
  display: inline-block;
  margin-bottom: 12px;
  padding: 8px 10px;
  background: var(--accent);
  font-family: 'Patrick Hand', 'Comic Sans MS', cursive;
  font-size: 1.18rem;
  transform: rotate(-2deg);
}

.cover-copy h2 {
  margin: 0;
  font-family: Impact, 'Arial Black', sans-serif;
  font-size: clamp(2.3rem, 5vw, 5.4rem);
  line-height: 0.88;
  letter-spacing: 0;
  text-transform: uppercase;
  overflow-wrap: break-word;
}

.cover-copy p {
  margin: 18px 0 0;
  font-size: 1rem;
}

.fold-sheet {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 2px solid #14120f;
  background: #fffaf0;
  box-shadow: 7px 7px 0 #14120f;
  transform: rotate(-2deg);
}

.fold-sheet span {
  display: grid;
  min-height: 96px;
  place-items: center;
  border: 1px dashed rgba(20, 18, 15, 0.72);
  font-family: 'Patrick Hand', 'Comic Sans MS', cursive;
  font-size: 1.6rem;
}

.fold-sheet span:nth-child(2),
.fold-sheet span:nth-child(3) {
  background: color-mix(in srgb, var(--accent), transparent 62%);
}

@media (max-width: 900px) {
  .editor-shell,
  .preview-area {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .editor-header {
    align-items: flex-start;
  }

  .editor-header nav {
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }

  .option-grid {
    grid-template-columns: 1fr;
  }

  .controls,
  .zine-cover,
  .fold-sheet {
    box-shadow: 5px 5px 0 #14120f;
  }
}
</style>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted } from 'vue'

const siteUrl = 'https://fanzines.app'
const pageTitle = 'Crea y exporta un fanzine A4'
const socialTitle = 'Fanzines | Crea y exporta un fanzine A4'
const pageDescription =
  'Fanzines es un editor para montar una publicación plegable en una hoja A4, añadir texto e imágenes, y exportarla como PDF.'
const socialDescription = 'Un editor sencillo para diseñar, previsualizar, imprimir y doblar tu propio fanzine.'
const socialImage = `${siteUrl}/images/og-fanzines.webp`

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  robots: 'index, follow',
  ogTitle: socialTitle,
  ogDescription: socialDescription,
  ogType: 'website',
  ogUrl: siteUrl,
  ogSiteName: 'Fanzines',
  ogImage: socialImage,
  ogImageAlt: 'Fanzine plegable y herramientas de edición en Fanzines',
  twitterCard: 'summary_large_image',
  twitterTitle: socialTitle,
  twitterDescription: socialDescription,
  twitterImage: socialImage
})

useHead({
  link: [
    { rel: 'canonical', href: siteUrl },
    {
      rel: 'preload',
      as: 'image',
      href: '/_ipx/s_300x235/images/folded-zine.webp',
      imagesrcset:
        '/_ipx/s_300x235/images/folded-zine.webp 300w, /_ipx/s_460x360/images/folded-zine.webp 460w',
      imagesizes: '(max-width: 500px) 300px, 460px',
      fetchpriority: 'high'
    }
  ]
})

// Mirrors IMPOSITION_SLOTS in utils/zineLayout.ts: top row prints upside down.
const sheetPanels = [
  { label: '6', flipped: true },
  { label: '5', flipped: true },
  { label: '4', flipped: true },
  { label: '3', flipped: true },
  { label: 'Contra', word: true },
  { label: 'Portada', word: true, cover: true },
  { label: '1' },
  { label: '2' }
]

const steps = [
  {
    title: 'Diseña cada panel',
    text: 'Sube fotos, escribe y mueve, gira o escala cada pieza directamente sobre la página.'
  },
  {
    title: 'Descarga el PDF',
    text: 'Las ocho caras salen ordenadas en una hoja A4 horizontal, con guías de corte y doblez.'
  },
  {
    title: 'Imprime, corta, dobla',
    text: 'Una impresora casera basta. En dos minutos tienes un fanzine para regalar o vender.'
  }
]

const features = [
  { icon: 'i-lucide-layout-grid', text: 'Guías de corte y doblez en cada panel' },
  { icon: 'i-lucide-image', text: 'Fotos, textos y collage libre' },
  { icon: 'i-lucide-file-down', text: 'PDF listo para cualquier impresora' },
  { icon: 'i-lucide-user-x', text: 'Sin cuentas ni instalaciones' }
]

let animationContext: { revert: () => void } | null = null

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger')
  ])

  gsap.registerPlugin(ScrollTrigger)
  await nextTick()

  const root = document.querySelector('.home-page')

  if (!root) {
    return
  }

  animationContext = gsap.context(() => {
    gsap.from('.site-header', {
      y: -24,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    })

    gsap.from('.hero-copy > *', {
      y: 40,
      opacity: 0,
      duration: 0.9,
      stagger: 0.08,
      ease: 'power3.out'
    })

    // The folded photo is the LCP image, so it stays put.
    gsap.from('.hero-collage > :not(.shot-folded)', {
      y: 64,
      opacity: 0,
      rotate: 0,
      duration: 1,
      delay: 0.2,
      stagger: 0.12,
      ease: 'power3.out'
    })

    gsap.utils.toArray<HTMLElement>('.reveal').forEach((element) => {
      gsap.from(element, {
        y: 48,
        opacity: 0,
        immediateRender: false,
        duration: 0.75,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 86%'
        }
      })
    })
  }, root)
})

onBeforeUnmount(() => {
  animationContext?.revert()
  animationContext = null
})
</script>

<template>
  <div class="home-page">
    <a class="skip-link" href="#contenido">Saltar al contenido</a>

    <header class="site-header band">
      <NuxtLink class="brand" to="/" aria-label="Fanzines inicio">
        <UIcon class="brand-icon" name="i-lucide-scissors" aria-hidden="true" />
        <span>Fanzines</span>
      </NuxtLink>
      <nav class="site-nav" aria-label="Secciones">
        <a class="nav-link" href="#como-se-hace">Cómo funciona</a>
        <a class="nav-link" href="#imprimir">Imprimir</a>
        <NuxtLink class="nav-cta" to="/editor">Abrir editor</NuxtLink>
      </nav>
    </header>

    <main id="contenido">
      <section class="hero band" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="hero-tag">Gratis · Sin registro · 1 hoja A4</p>
          <h1 id="hero-title" class="display hero-title">
            <span>Una hoja. </span>
            <span>Ocho páginas. </span>
            <span>Tu fanzine.</span>
          </h1>
          <p class="hero-lede">
            Diseña cada panel en el navegador y descarga un PDF ya impuesto. Imprime, corta una línea,
            dobla. Listo para repartir en 10 minutos.
          </p>
          <div class="hero-actions">
            <NuxtLink class="button button-primary" to="/editor">
              Crear mi fanzine
              <UIcon class="button-icon" name="i-lucide-arrow-right" aria-hidden="true" />
            </NuxtLink>
            <a class="text-link" href="#como-se-hace">
              Ver cómo se imprime
              <UIcon class="text-link-icon" name="i-lucide-arrow-down" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div class="hero-collage">
          <div class="photo shot-folded">
            <NuxtImg
              src="/images/folded-zine.webp"
              alt="Fanzine desplegado sobre una mesa"
              width="460"
              height="360"
              sizes="300px sm:460px"
              densities="x1"
              loading="eager"
              fetchpriority="high"
              decoding="async"
            />
          </div>
          <div class="photo shot-hand">
            <NuxtImg
              src="/images/hand-zine.webp"
              alt="Fanzine pequeño abierto en una mano"
              width="230"
              height="340"
              sizes="160px sm:230px"
              densities="x1"
              loading="lazy"
              decoding="async"
            />
          </div>
          <p class="sticker">8 páginas / PDF / A4</p>
        </div>
      </section>

      <section id="como-se-hace" class="how band" aria-labelledby="how-title">
        <div class="how-header reveal">
          <h2 id="how-title" class="display how-title">
            <span>Del navegador </span>
            <span>a la mesa.</span>
          </h2>
          <p class="how-intro">
            Nada de calcular el orden de las páginas. El editor monta el pliego por ti.
          </p>
        </div>

        <div id="imprimir" class="how-body">
          <figure class="sheet reveal">
            <figcaption class="sheet-label">Pliego A4 · se imprime así</figcaption>
            <div
              class="sheet-grid"
              role="img"
              aria-label="Pliego A4: arriba, las páginas 6, 5, 4 y 3 boca abajo; abajo, contraportada, portada, 1 y 2."
            >
              <span
                v-for="panel in sheetPanels"
                :key="panel.label"
                class="sheet-panel"
                :class="{ 'is-flipped': panel.flipped, 'is-word': panel.word, 'is-cover': panel.cover }"
              >
                {{ panel.label }}
              </span>
            </div>
            <p class="sheet-note">
              <UIcon class="sheet-note-icon" name="i-lucide-scissors" aria-hidden="true" />
              la fila de arriba se imprime al revés · corta solo la línea central
            </p>
          </figure>

          <ol class="steps">
            <li v-for="(step, index) in steps" :key="step.title" class="step reveal">
              <span class="step-num" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
              <div class="step-copy">
                <h3 class="step-title">{{ step.title }}</h3>
                <p class="step-text">{{ step.text }}</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section id="editor" class="feature band" aria-labelledby="feature-title">
        <figure class="feature-photo reveal">
          <NuxtImg
            src="/images/making-table.webp"
            alt="Mesa de trabajo con fotos impresas, cutter, regla y tijeras"
            width="440"
            height="560"
            sizes="360px sm:440px"
            densities="x1"
            loading="lazy"
            decoding="async"
          />
        </figure>
        <div class="feature-copy reveal">
          <p class="eyebrow">El editor</p>
          <h2 id="feature-title" class="display feature-title">
            <span>Diseña en pantalla. </span>
            <span>Termina con papel </span>
            <span>y tijeras.</span>
          </h2>
          <ul class="feature-list">
            <li v-for="feature in features" :key="feature.text" class="feature-item">
              <UIcon class="feature-icon" :name="feature.icon" aria-hidden="true" />
              {{ feature.text }}
            </li>
          </ul>
        </div>
      </section>

      <section class="final-cta band" aria-labelledby="cta-title">
        <h2 id="cta-title" class="display cta-title reveal">
          <span>Empieza con una portada </span>
          <span>y una imagen.</span>
        </h2>
        <div class="cta-row reveal">
          <NuxtLink class="button button-dark" to="/editor">
            Crear fanzine gratis
            <UIcon class="button-icon" name="i-lucide-arrow-right" aria-hidden="true" />
          </NuxtLink>
          <p class="cta-note">Tarda menos que ir a la copistería.</p>
        </div>
      </section>
    </main>

    <footer class="site-footer band">
      <span class="footer-brand">Fanzines</span>
      <div class="footer-links">
        <span>Por Wilson Tovar</span>
        <a href="https://krthr.co" target="_blank" rel="author me noopener noreferrer">krthr.co</a>
        <a href="https://www.instagram.com/wilson__tovar/" target="_blank" rel="me noopener noreferrer">
          Instagram
        </a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.home-page {
  --bg: #0b0a09;
  --ink: #ede7da;
  --muted: #a8a196;
  --orange: #d25a36;
  --orange-deep: #8e3a22;
  --acid: #e9ff5c;
  --paper: #f4f0e8;
  --ink-dark: #0b0a09;
  --text-dark: #3a3631;
  --panel-num: #b5aea2;
  --font-display: Anton, Impact, "Arial Narrow Bold", sans-serif;
  --font-body: Outfit, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-type: "Special Elite", "Courier New", monospace;
  --content: 1200px;
  --gutter: 48px;
  --section-y: 120px;
  min-width: 320px;
  min-height: 100dvh;
  overflow-x: clip;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
}

.home-page a:focus-visible {
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

.skip-link {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 5;
  padding: 10px 14px;
  background: var(--acid);
  color: var(--ink-dark);
  font-weight: 700;
  transform: translateY(-160%);
  transition: transform 180ms ease;
}

.skip-link:focus {
  transform: translateY(0);
}

/* Header */

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
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

.site-nav {
  display: flex;
  align-items: center;
  gap: 36px;
}

.nav-link {
  color: var(--muted);
  font-size: 15px;
  transition: color 180ms ease;
}

.nav-link:hover {
  color: var(--ink);
}

.nav-cta {
  padding: 10px 18px;
  background: var(--ink);
  color: var(--ink-dark);
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  transition: background 180ms ease;
}

.nav-cta:hover {
  background: var(--acid);
}

/* Buttons */

.button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
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
  padding: 18px 28px;
  background: var(--orange);
  color: var(--ink-dark);
  font-size: 17px;
}

.button-dark {
  padding: 20px 32px;
  background: var(--ink-dark);
  color: var(--ink);
  font-size: 18px;
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 500;
  text-underline-offset: 5px;
}

.text-link:hover {
  text-decoration: underline;
}

.text-link-icon {
  width: 16px;
  height: 16px;
  transition: transform 180ms ease;
}

.text-link:hover .text-link-icon {
  transform: translateY(3px);
}

/* Hero */

.hero {
  display: flex;
  align-items: center;
  gap: 64px;
  padding-block: 64px var(--section-y);
}

.hero-copy {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 32px;
  min-width: 0;
}

.hero-tag {
  margin: 0;
  padding: 6px 12px;
  background: var(--acid);
  color: var(--ink-dark);
  font-family: var(--font-type);
  font-size: 15px;
  line-height: 1.2;
  transform: rotate(-2deg);
}

.hero-title {
  font-size: clamp(4.5rem, 7.4vw, 6.5rem);
  line-height: 0.95;
}

.hero-title span {
  white-space: nowrap;
}

.hero-lede {
  max-width: 520px;
  margin: 0;
  color: var(--muted);
  font-size: 20px;
  line-height: 1.5;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
}

.hero-collage {
  position: relative;
  flex: none;
  width: min(560px, 42vw);
  aspect-ratio: 560 / 600;
  container-type: inline-size;
}

.hero-collage > * {
  position: absolute;
  transform-origin: top left;
}

.photo {
  overflow: hidden;
  background: var(--ink);
}

.photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 700ms ease;
}

.photo:hover img,
.feature-photo:hover img {
  transform: scale(1.04);
}

.shot-folded {
  top: 3.333%;
  left: 3.571%;
  width: 82.143%;
  height: 60%;
  border: max(5px, 1.786cqi) solid var(--ink);
  box-shadow: 0 20px 40px rgb(0 0 0 / 60%);
  transform: rotate(3deg);
}

.shot-hand {
  top: 41.667%;
  left: 53.571%;
  width: 41.071%;
  height: 56.667%;
  border: max(4px, 1.429cqi) solid var(--ink);
  box-shadow: 0 20px 40px rgb(0 0 0 / 67%);
  transform: rotate(-4deg);
}

.sticker {
  top: 73.333%;
  left: 1.786%;
  margin: 0;
  padding: 1.786cqi 2.857cqi;
  background: var(--acid);
  color: var(--ink-dark);
  font-family: var(--font-type);
  font-size: max(13px, 3.571cqi);
  line-height: 1.2;
  white-space: nowrap;
  transform: rotate(4deg);
}

/* How it works */

.how {
  display: flex;
  flex-direction: column;
  gap: 64px;
  padding-block: var(--section-y);
  background: var(--ink);
  color: var(--ink-dark);
}

.how-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
}

.how-title {
  font-size: clamp(2.75rem, 13vw, 5rem);
  line-height: 0.95;
}

.how-intro {
  flex: 0 1 400px;
  margin: 0;
  color: var(--text-dark);
  font-size: 20px;
  line-height: 1.5;
}

.how-body {
  display: flex;
  align-items: center;
  gap: 48px;
  scroll-margin-top: 32px;
}

.sheet {
  display: flex;
  flex: 0 1 640px;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  margin: 0;
  padding: 24px;
  border: 2px solid var(--ink-dark);
  background: #fff;
  box-shadow: 12px 12px 0 var(--ink-dark);
  container-type: inline-size;
}

.sheet-label,
.sheet-note {
  margin: 0;
  color: var(--text-dark);
  font-family: var(--font-type);
  font-size: 15px;
  line-height: 1.3;
}

.sheet-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  border: 1px solid var(--ink-dark);
  background: var(--ink-dark);
}

.sheet-panel {
  display: grid;
  aspect-ratio: 148 / 180;
  place-items: center;
  background: var(--paper);
  color: var(--panel-num);
  font-family: var(--font-display);
  font-size: 6.8cqi;
  line-height: 1;
  text-transform: uppercase;
}

.sheet-panel.is-flipped {
  transform: rotate(180deg);
}

.sheet-panel.is-word {
  font-size: 4.1cqi;
  text-transform: none;
}

.sheet-panel.is-cover {
  background: var(--orange);
  color: var(--ink-dark);
}

.sheet-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.sheet-note-icon {
  flex: none;
  width: 16px;
  height: 16px;
  margin-top: 1px;
  color: var(--orange);
}

.steps {
  flex: 1 1 360px;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.step {
  display: flex;
  gap: 24px;
  padding-block: 28px;
}

.step + .step {
  border-top: 1px solid rgb(11 10 9 / 20%);
}

.step-num {
  color: var(--orange);
  font-family: var(--font-type);
  font-size: 20px;
  line-height: 1.2;
}

.step-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.25;
}

.step-text {
  margin: 0;
  color: var(--text-dark);
  font-size: 17px;
  line-height: 1.5;
}

/* Editor feature */

.feature {
  display: flex;
  align-items: center;
  gap: clamp(48px, 6.667vw, 96px);
  padding-block: var(--section-y);
}

.feature-photo {
  flex: none;
  width: min(440px, 100%);
  aspect-ratio: 440 / 560;
  margin: 0;
  overflow: hidden;
  border: 10px solid var(--ink);
  background: var(--ink);
  transform: rotate(2deg);
}

.feature-photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 700ms ease;
}

.feature-copy {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 28px;
  min-width: 0;
}

.eyebrow {
  margin: 0;
  color: var(--acid);
  font-family: var(--font-type);
  font-size: 18px;
  line-height: 1.2;
}

.feature-title {
  font-size: clamp(3rem, 4.9vw, 4rem);
  line-height: 1;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 19px;
  line-height: 1.3;
}

.feature-icon {
  flex: none;
  width: 22px;
  height: 22px;
  color: var(--orange);
}

/* Final CTA */

.final-cta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 40px;
  padding-block: var(--section-y);
  background: var(--orange);
  color: var(--ink-dark);
}

.cta-title {
  font-size: clamp(2.5rem, 8.6vw, 6rem);
  line-height: 0.95;
}

.cta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
}

.cta-note {
  margin: 0;
  font-family: var(--font-type);
  font-size: 18px;
  line-height: 1.3;
}

/* Footer */

.site-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-block: 32px;
}

.footer-brand {
  font-family: var(--font-display);
  font-size: 18px;
  line-height: 1.5;
  text-transform: uppercase;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 28px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.3;
}

.footer-links a {
  transition: color 180ms ease;
}

.footer-links a:hover {
  color: var(--ink);
}

/* Responsive */

@media (max-width: 1040px) {
  .home-page {
    --gutter: 32px;
    --section-y: 96px;
  }

  .hero,
  .how-body,
  .feature {
    flex-direction: column;
    align-items: stretch;
  }

  .hero {
    gap: 56px;
    padding-top: 40px;
  }

  .hero-title {
    font-size: clamp(3rem, 14.6vw, 6.5rem);
  }

  .hero-title span {
    white-space: normal;
  }

  .hero-collage {
    width: min(560px, 100%);
  }

  .how-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
  }

  .how-intro {
    flex-basis: auto;
    max-width: 520px;
  }

  .sheet {
    flex-basis: auto;
    width: min(640px, 100%);
  }

  .steps {
    flex-basis: auto;
  }

  .feature {
    gap: 56px;
  }

  .feature-title {
    font-size: clamp(2.25rem, 10vw, 4rem);
  }

  .cta-title span {
    display: inline;
  }
}

@media (max-width: 760px) {
  .home-page {
    --gutter: 18px;
    --section-y: 72px;
  }

  .site-header {
    padding-block: 20px;
  }

  .nav-link {
    display: none;
  }

  .hero {
    padding-top: 24px;
  }

  .hero-lede,
  .how-intro {
    font-size: 18px;
  }

  .how {
    gap: 48px;
  }

  .sheet {
    padding: 16px;
    box-shadow: 8px 8px 0 var(--ink-dark);
  }

  .sheet-label,
  .sheet-note {
    font-size: 13px;
  }

  .step {
    gap: 16px;
    padding-block: 24px;
  }

  .step-title {
    font-size: 22px;
  }

  .step-text {
    font-size: 16px;
  }

  .feature-photo {
    border-width: 8px;
  }

  .feature-item {
    font-size: 17px;
  }

  .cta-row {
    align-items: stretch;
    flex-direction: column;
    width: 100%;
  }

  .button {
    justify-content: center;
  }

  .button-dark {
    width: 100%;
  }

  .site-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted } from 'vue'
import LocaleSwitcher from '~/components/LocaleSwitcher.vue'

const siteUrl = 'https://fanzines.app'
const socialImage = `${siteUrl}/images/og-fanzines.webp`
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const pageUrl = computed(() => new URL(route.path, siteUrl).href)

useSeoMeta({
  title: () => t('home.seo.title'),
  description: () => t('home.seo.description'),
  robots: 'index, follow',
  ogTitle: () => t('home.seo.socialTitle'),
  ogDescription: () => t('home.seo.socialDescription'),
  ogType: 'website',
  ogUrl: () => pageUrl.value,
  ogSiteName: 'Fanzines',
  ogImage: socialImage,
  ogImageAlt: () => t('home.seo.imageAlt'),
  twitterCard: 'summary_large_image',
  twitterTitle: () => t('home.seo.socialTitle'),
  twitterDescription: () => t('home.seo.socialDescription'),
  twitterImage: socialImage
})

useHead({
  link: [
    {
      rel: 'preload',
      as: 'image',
      href: '/_ipx/s_326x255/images/folded-zine.webp',
      imagesrcset:
        '/_ipx/s_326x255/images/folded-zine.webp 326w, /_ipx/s_430x336/images/folded-zine.webp 430w, /_ipx/s_570x445/images/folded-zine.webp 570w',
      imagesizes:
        '(max-width: 500px) 326px, (max-width: 760px) 430px, (max-width: 1040px) 570px, (max-width: 1240px) 430px, 570px',
      fetchpriority: 'high'
    }
  ]
})

const steps = computed(() => [
  {
    title: t('home.steps.layout.title'),
    text: t('home.steps.layout.text')
  },
  {
    title: t('home.steps.content.title'),
    text: t('home.steps.content.text')
  },
  {
    title: t('home.steps.export.title'),
    text: t('home.steps.export.text')
  }
])

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
      y: -28,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    })

    gsap.from('.hero-copy > *', {
      y: 42,
      opacity: 0,
      duration: 0.9,
      stagger: 0.08,
      ease: 'power3.out'
    })

    gsap.from('.paper-shot:not(.shot-main)', {
      y: 76,
      opacity: 0,
      rotate: 0,
      duration: 1,
      stagger: 0.12,
      ease: 'power3.out'
    })

    gsap.utils.toArray<HTMLElement>('.motion-image').forEach((image) => {
      gsap.fromTo(
        image,
        {
          scale: 0.9,
          opacity: 0.72,
          filter: 'grayscale(1) contrast(1.65)'
        },
        {
          scale: 1,
          opacity: 1,
          filter: 'grayscale(0.15) contrast(1.35)',
          immediateRender: false,
          ease: 'none',
          scrollTrigger: {
            trigger: image,
            start: 'top 88%',
            end: 'bottom 26%',
            scrub: true
          }
        }
      )
    })

    gsap.utils.toArray<HTMLElement>('.section-panel, .step-card').forEach((panel) => {
      gsap.from(panel, {
        y: 58,
        opacity: 0,
        immediateRender: false,
        duration: 0.75,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: panel,
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
  <main class="home-page">
    <a class="skip-link" href="#contenido">{{ t('home.skipLink') }}</a>

    <header class="site-header" :aria-label="t('home.header.ariaLabel')">
      <NuxtLink class="brand" :to="localePath('/')" :aria-label="t('home.header.homeAriaLabel')">
        <span class="brand-mark" aria-hidden="true">FZ</span>
        <span>Fanzines</span>
      </NuxtLink>
      <nav :aria-label="t('home.header.navLabel')">
        <a href="#editor">{{ t('home.header.include') }}</a>
        <a href="#como-se-hace">{{ t('home.header.print') }}</a>
        <NuxtLink :to="localePath('/editor')">{{ t('home.header.openEditor') }}</NuxtLink>
        <LocaleSwitcher />
      </nav>
    </header>

    <section id="contenido" class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <h1 id="hero-title">
          <span>{{ t('home.hero.titleLead') }}&nbsp;</span>
          <span class="hero-title-tail">{{ t('home.hero.titleTailLead') }} <br class="mobile-title-break" />{{ t('home.hero.titleTailBreak') }}</span>
        </h1>
        <p>
          {{ t('home.hero.description') }}
        </p>
        <div class="actions" :aria-label="t('home.hero.actionsLabel')">
          <NuxtLink class="button button-primary" :to="localePath('/editor')">{{ t('home.hero.openEditor') }}</NuxtLink>
          <a class="button button-secondary" href="#como-se-hace">{{ t('home.hero.printGuide') }}</a>
        </div>
      </div>

      <div class="hero-media" :aria-label="t('home.hero.mediaLabel')">
        <div class="paper-shot shot-main">
          <NuxtImg
            src="/images/folded-zine.webp"
            :alt="t('home.hero.foldedAlt')"
            width="570"
            height="445"
            sizes="326px sm:430px md:570px lg:430px xl:570px"
            densities="x1"
            loading="eager"
            fetchpriority="high"
            decoding="async"
          />
        </div>
        <div class="paper-shot shot-hand motion-image">
          <NuxtImg
            src="/images/hand-zine.webp"
            :alt="t('home.hero.handAlt')"
            width="245"
            height="383"
            sizes="130px sm:160px md:190px lg:245px"
            densities="x1"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div class="paper-note">{{ t('home.hero.note') }}</div>
      </div>
    </section>

    <section id="editor" class="definition section-panel" aria-labelledby="definition-title">
      <div class="definition-copy">
        <h2 id="definition-title">{{ t('home.definition.title') }}</h2>
        <p>
          {{ t('home.definition.description') }}
        </p>
      </div>
      <figure class="table-photo">
        <NuxtImg
          class="motion-image"
          src="/images/making-table.webp"
          :alt="t('home.definition.tableAlt')"
          width="514"
          height="913"
          sizes="376px sm:472px md:514px lg:514px"
          densities="x1"
          loading="lazy"
          decoding="async"
        />
        <figcaption>{{ t('home.definition.caption') }}</figcaption>
      </figure>
    </section>

    <section id="como-se-hace" class="making" aria-labelledby="making-title">
      <div class="making-intro">
        <h2 id="making-title">{{ t('home.making.title') }}</h2>
        <p>{{ t('home.making.description') }}</p>
      </div>

      <div class="fold-layout section-panel">
        <NuxtImg
          class="fold-guide motion-image"
          src="/images/fold-guide.webp"
          :alt="t('home.making.foldGuideAlt')"
          width="560"
          height="420"
          sizes="376px sm:472px md:560px lg:560px xl:560px"
          densities="x1"
          loading="lazy"
          decoding="async"
        />
        <ol>
          <li v-for="step in steps" :key="step.title" class="step-card">
            <strong>{{ step.title }}</strong>
            <span>{{ step.text }}</span>
          </li>
        </ol>
      </div>
    </section>

    <section class="final-cta" aria-labelledby="cta-title">
      <h2 id="cta-title">{{ t('home.finalCta.title') }}</h2>
      <NuxtLink class="button button-primary" :to="localePath('/editor')">{{ t('home.finalCta.button') }}</NuxtLink>
    </section>

    <footer>
      <span>Fanzines</span>
      <span>fanzines.app</span>
    </footer>
  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

.home-page {
  --ink: var(--zine-bg);
  --paper: var(--zine-paper);
  --paper-hot: #fff6c8;
  --acid: var(--zine-accent);
  --red: var(--zine-cut);
  --cyan: var(--zine-cyan);
  position: relative;
  width: 100%;
  min-width: 320px;
  min-height: 100dvh;
  overflow-x: hidden;
  background:
    linear-gradient(rgb(255 255 255 / 5%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 4%) 1px, transparent 1px),
    radial-gradient(circle at 72% 10%, rgb(242 61 37 / 18%), transparent 26rem),
    var(--ink);
  background-size: 24px 24px, 24px 24px, auto, auto;
  color: var(--paper);
  font-family: Outfit, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.home-page::before,
.home-page::after {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  content: "";
}

.home-page::before {
  opacity: 0.2;
  background:
    repeating-linear-gradient(0deg, rgb(255 255 255 / 9%) 0 1px, transparent 1px 5px),
    repeating-linear-gradient(90deg, rgb(0 0 0 / 45%) 0 2px, transparent 2px 7px);
  mix-blend-mode: overlay;
}

.home-page::after {
  opacity: 0.24;
  background-image:
    radial-gradient(circle, rgb(255 255 255 / 26%) 0 1px, transparent 1px),
    radial-gradient(circle, rgb(0 0 0 / 42%) 0 1px, transparent 1px);
  background-position: 0 0, 9px 13px;
  background-size: 18px 18px, 22px 22px;
}

.home-page a {
  color: inherit;
  text-decoration: none;
}

.skip-link {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 5;
  padding: 10px 14px;
  border: 2px solid var(--paper);
  background: var(--acid);
  color: var(--ink);
  transform: translateY(-140%);
  transition: transform 180ms ease;
}

.skip-link:focus {
  transform: translateY(0);
}

.site-header,
.hero,
.definition,
.making,
.final-cta,
footer {
  position: relative;
  z-index: 1;
  width: min(1240px, calc(100% - 36px));
  margin-inline: auto;
}

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 22px 0;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--paper);
  font-size: 1.18rem;
  font-weight: 900;
  text-transform: uppercase;
}

.brand-mark {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 2px solid var(--paper);
  background: var(--paper);
  color: var(--ink);
  font-size: 0.96rem;
  transform: rotate(-4deg);
}

.site-header nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.site-header nav a {
  min-height: 38px;
  padding: 9px 13px;
  border: 1px solid rgb(238 232 216 / 34%);
  background: rgb(238 232 216 / 6%);
  color: var(--paper);
  font-size: 0.86rem;
  font-weight: 800;
  text-transform: uppercase;
}

.site-header nav a:hover {
  background: var(--acid);
  color: var(--ink);
}

.site-header a:focus-visible,
.button:focus-visible {
  outline: 3px solid var(--acid);
  outline-offset: 4px;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 0.96fr) minmax(390px, 0.74fr);
  gap: clamp(40px, 7vw, 100px);
  align-items: center;
  min-height: calc(100svh - 92px);
  padding: 34px 0 78px;
}

.hero-copy h1,
.definition h2,
.making h2,
.final-cta h2 {
  margin: 0;
  color: var(--paper);
  font-family: Impact, "Arial Black", Outfit, sans-serif;
  font-weight: 900;
  line-height: 0.86;
  letter-spacing: 0;
  text-transform: uppercase;
}

.hero-copy h1 {
  max-width: min(960px, 100%);
  font-size: 5.15rem;
}

.mobile-title-break {
  display: none;
}

.hero-copy p,
.definition p,
.making-intro p,
.final-cta p {
  max-width: 690px;
  margin: 30px 0 0;
  color: rgb(238 232 216 / 82%);
  font-size: 1.18rem;
  font-weight: 600;
  line-height: 1.52;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 36px;
}

.home-page .button {
  display: inline-flex;
  min-height: 52px;
  align-items: center;
  justify-content: center;
  padding: 0 22px;
  border: 2px solid currentColor;
  color: var(--ink);
  font-size: 0.95rem;
  font-weight: 900;
  line-height: 1;
  text-transform: uppercase;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
}

.button:hover {
  transform: translate(-4px, -4px);
  box-shadow: 6px 6px 0 var(--paper);
}

.button:active {
  transform: translate(0, 0);
  box-shadow: 2px 2px 0 var(--paper);
}

.home-page .button-primary {
  border-color: var(--red);
  background: var(--red);
  color: var(--ink);
}

.home-page .button-secondary {
  border-color: var(--paper);
  background: var(--paper);
  color: var(--ink);
}

.hero-media {
  position: relative;
  min-height: 650px;
}

.paper-shot {
  position: absolute;
  overflow: hidden;
  border: 9px solid var(--paper);
  background: var(--paper);
  box-shadow: 14px 16px 0 rgb(0 0 0 / 88%);
  transition:
    transform 700ms ease,
    filter 700ms ease;
}

.paper-shot::before {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  content: "";
  background:
    linear-gradient(135deg, transparent 0 84%, rgb(231 255 54 / 72%) 84% 90%, transparent 90%),
    repeating-linear-gradient(0deg, rgb(255 255 255 / 16%) 0 1px, transparent 1px 4px);
  mix-blend-mode: multiply;
}

.paper-shot img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1) contrast(1.35);
  transition: transform 700ms ease;
}

.paper-shot:hover img,
.table-photo:hover img,
.fold-layout:hover .fold-guide {
  transform: scale(1.05);
}

.shot-main {
  top: 36px;
  right: 0;
  width: min(570px, 96%);
  aspect-ratio: 1.28;
  transform: rotate(2deg);
  clip-path: polygon(2% 0, 100% 3%, 97% 96%, 0 100%);
}

.shot-hand {
  right: 6%;
  bottom: 34px;
  width: min(245px, 44%);
  aspect-ratio: 0.64;
  transform: rotate(-7deg);
  clip-path: polygon(0 4%, 98% 0, 100% 100%, 5% 96%);
}

.paper-note {
  position: absolute;
  left: 0;
  bottom: 96px;
  z-index: 2;
  max-width: 295px;
  padding: 15px 18px 12px;
  background: var(--acid);
  color: var(--ink);
  font-family: "Special Elite", "Courier New", monospace;
  font-size: 1.16rem;
  line-height: 1.12;
  transform: rotate(4deg);
  box-shadow: 8px 8px 0 rgb(0 0 0 / 92%);
}

.definition {
  display: grid;
  grid-template-columns: minmax(0, 0.78fr) minmax(320px, 0.66fr);
  gap: clamp(36px, 7vw, 96px);
  align-items: center;
  padding: 150px 0 170px;
}

.definition h2,
.making h2,
.final-cta h2 {
  font-size: 6.2rem;
}

.table-photo {
  position: relative;
  margin: 0;
  transform: rotate(-2deg);
}

.table-photo img,
.fold-guide {
  display: block;
  width: 100%;
  border: 9px solid var(--paper);
  background: var(--paper);
  box-shadow: 14px 14px 0 rgb(0 0 0 / 86%);
  filter: grayscale(1) contrast(1.28);
  transition: transform 700ms ease;
}

.table-photo img {
  max-height: 580px;
  object-fit: cover;
}

.table-photo figcaption {
  position: relative;
  z-index: 1;
  width: fit-content;
  max-width: 88%;
  margin: -22px 0 0 18px;
  padding: 13px 16px 11px;
  background: var(--acid);
  color: var(--ink);
  font-family: "Special Elite", "Courier New", monospace;
  font-size: 1rem;
  line-height: 1.25;
  transform: rotate(2deg);
  box-shadow: 7px 7px 0 rgb(0 0 0 / 92%);
}

.making {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 150px max(18px, calc((100% - 1240px) / 2)) 162px;
  background:
    linear-gradient(90deg, rgb(7 7 6 / 92%), rgb(7 7 6 / 78%)),
    var(--paper);
  border-block: 2px solid rgb(238 232 216 / 72%);
}

.making-intro {
  display: grid;
  grid-template-columns: minmax(0, 0.7fr) minmax(280px, 0.42fr);
  gap: clamp(32px, 6vw, 84px);
  align-items: end;
  width: min(1240px, 100%);
  margin: 0 auto 56px;
}

.making-intro p {
  margin-top: 0;
}

.fold-layout {
  display: grid;
  grid-template-columns: minmax(320px, 0.86fr) minmax(280px, 0.58fr);
  gap: clamp(24px, 5vw, 64px);
  align-items: stretch;
  width: min(1240px, 100%);
  margin-inline: auto;
}

.fold-guide {
  min-height: 460px;
  object-fit: contain;
  padding: 22px;
}

.fold-layout ol {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: steps;
}

.step-card {
  position: relative;
  min-height: 145px;
  padding: 24px 24px 22px 76px;
  border: 2px solid var(--paper);
  background: var(--paper);
  color: var(--ink);
  counter-increment: steps;
}

.step-card:nth-child(2) {
  background: var(--acid);
}

.step-card:nth-child(3) {
  background: var(--red);
  color: var(--ink);
}

.step-card::before {
  position: absolute;
  top: 22px;
  left: 22px;
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 2px solid currentColor;
  content: counter(steps);
  font-family: "Special Elite", "Courier New", monospace;
  font-size: 1rem;
}

.step-card strong,
.step-card span {
  display: block;
}

.step-card strong {
  font-size: 1.72rem;
  font-weight: 900;
  line-height: 0.95;
  text-transform: uppercase;
}

.step-card span {
  margin-top: 12px;
  font-weight: 700;
  line-height: 1.45;
}

.final-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 34px;
  padding: 158px 0 132px;
}

.final-cta h2 {
  max-width: 980px;
}

footer {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 30px 0 40px;
  border-top: 2px solid rgb(238 232 216 / 72%);
  color: rgb(238 232 216 / 78%);
  font-size: 0.92rem;
  font-weight: 800;
  text-transform: uppercase;
}

@media (min-width: 1180px) {
  .hero-copy h1 {
    font-size: 5.8rem;
  }

  .definition h2,
  .making h2,
  .final-cta h2 {
    font-size: 7rem;
  }
}

@media (max-width: 1040px) {
  .hero,
  .definition,
  .making-intro,
  .fold-layout {
    grid-template-columns: 1fr;
  }

  .hero {
    min-height: auto;
  }

  .hero-media {
    min-height: 540px;
  }

  .making {
    padding-inline: 18px;
  }

  .final-cta {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 760px) {
  .site-header {
    align-items: flex-start;
  }

  .brand {
    font-size: 1rem;
  }

  .site-header nav {
    gap: 6px;
    max-width: 220px;
  }

  .hero {
    gap: 28px;
    padding-top: 12px;
    padding-bottom: 34px;
  }

  .hero-copy h1,
  .definition h2,
  .making h2,
  .final-cta h2 {
    font-size: 3.8rem;
  }

  .hero-copy p,
  .definition p,
  .making-intro p {
    font-size: 1.04rem;
  }

  .actions,
  .final-cta {
    align-items: stretch;
  }

  .home-page .button {
    width: 100%;
  }

  .hero-media {
    min-height: 314px;
  }

  .shot-main {
    width: 86%;
  }

  .shot-hand {
    right: 2%;
    bottom: 14px;
    width: 32%;
  }

  .paper-note {
    left: 4px;
    bottom: 12px;
    max-width: 250px;
    font-size: 0.96rem;
  }

  .definition,
  .making {
    padding-block: 96px;
  }

  .fold-guide {
    min-height: 320px;
  }
}

@media (max-width: 500px) {
  .site-header,
  .hero,
  .definition,
  .final-cta,
  footer {
    width: min(100% - 28px, 1240px);
  }

  .site-header {
    flex-direction: column;
    gap: 14px;
  }

  .site-header nav {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    width: 100%;
    max-width: none;
    justify-content: stretch;
  }

  .site-header nav a {
    min-width: 0;
    text-align: center;
  }

  .hero-copy h1 span:first-child,
  .hero-title-tail {
    display: block;
  }

  .mobile-title-break {
    display: block;
  }

  .site-header nav a {
    min-height: 34px;
    padding: 8px 4px;
    font-size: 0.68rem;
  }

  .hero-copy h1,
  .definition h2,
  .making h2,
  .final-cta h2 {
    font-size: 3.12rem;
  }

  .hero-media {
    min-height: 292px;
  }

  .paper-shot {
    border-width: 6px;
    box-shadow: 8px 10px 0 rgb(0 0 0 / 88%);
  }

  .paper-note {
    max-width: 210px;
  }

  .table-photo img,
  .fold-guide {
    border-width: 6px;
    box-shadow: 8px 10px 0 rgb(0 0 0 / 86%);
  }

  .step-card {
    min-height: auto;
    padding: 20px 18px 18px 62px;
  }

  .step-card::before {
    top: 18px;
    left: 16px;
  }

  .step-card strong {
    font-size: 1.36rem;
  }

  footer {
    flex-direction: column;
  }
}
</style>

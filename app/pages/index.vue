<script setup>
useHead({
  title: 'Fanzines | Publica una idea doblada en papel',
  meta: [
    {
      name: 'description',
      content:
        'Fanzines explica qué es un fanzine y cómo convertir una idea en una publicación breve, hecha a mano y lista para compartir.'
    },
    { property: 'og:title', content: 'Fanzines | Publica una idea doblada en papel' },
    {
      property: 'og:description',
      content:
        'Una landing sencilla y handmade para entender qué es un fanzine y empezar uno en beta.fanzines.app.'
    },
    { property: 'og:url', content: 'https://beta.fanzines.app' }
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

const steps = [
  {
    title: 'Dobla una hoja',
    text: 'Un fanzine puede empezar con una sola página A4, ocho caras y un corte en medio.'
  },
  {
    title: 'Pega tus imágenes',
    text: 'Fotos, notas, dibujos, recortes y huecos. La mezcla es parte del lenguaje.'
  },
  {
    title: 'Compártelo',
    text: 'Imprime, exporta o pásalo por enlace. Lo importante es que circule.'
  }
]
</script>

<template>
  <main class="home-page">
    <header class="site-header" aria-label="Navegación principal">
      <NuxtLink class="brand" to="/" aria-label="Fanzines inicio">Fanzines</NuxtLink>
      <nav aria-label="Secciones">
        <a href="#que-es">Qué es</a>
        <a href="#como-se-hace">Cómo se hace</a>
        <NuxtLink to="/editor">Editor</NuxtLink>
      </nav>
    </header>

    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <h1 id="hero-title">Haz un fanzine con papel, tijeras y una idea.</h1>
        <p>
          Fanzines es una forma sencilla de convertir una obsesión, una serie de fotos o una
          pequeña historia en una publicación que se dobla, se abre y se comparte.
        </p>
        <div class="actions" aria-label="Acciones principales">
          <NuxtLink class="button button-dark" to="/editor">Empezar un fanzine</NuxtLink>
          <a class="button button-light" href="#como-se-hace">Ver el pliegue</a>
        </div>
      </div>

      <div class="hero-board" aria-label="Fanzine físico hecho a mano">
        <img class="photo photo-main" src="/images/folded-zine.webp" alt="Fanzine desplegado sobre una mesa" />
        <img class="photo photo-small" src="/images/hand-zine.webp" alt="Fanzine pequeño abierto en una mano" />
        <p class="tape-note">1 hoja / 8 páginas / corte central</p>
      </div>
    </section>

    <section id="que-es" class="definition" aria-labelledby="definition-title">
      <div>
        <h2 id="definition-title">¿Qué es un fanzine?</h2>
        <p>
          Una publicación independiente, corta y directa. Puede ser fotográfica, escrita, dibujada o
          una mezcla de todo. No necesita permiso editorial: necesita una voz y una forma de viajar.
        </p>
      </div>
      <figure class="table-photo">
        <img src="/images/making-table.webp" alt="Mesa de trabajo con fotos impresas, cutter, regla y tijeras" />
        <figcaption>Cortar, doblar, ordenar. La parte física también piensa.</figcaption>
      </figure>
    </section>

    <section id="como-se-hace" class="making" aria-labelledby="making-title">
      <div class="making-intro">
        <h2 id="making-title">Cómo se hace</h2>
        <p>Una estructura mínima para que la idea salga de la pantalla y se convierta en objeto.</p>
      </div>

      <div class="fold-layout">
        <img src="/images/fold-guide.webp" alt="Diagrama dibujado a mano para doblar y cortar un fanzine" />
        <ol>
          <li v-for="step in steps" :key="step.title">
            <strong>{{ step.title }}</strong>
            <span>{{ step.text }}</span>
          </li>
        </ol>
      </div>
    </section>

    <section class="final-cta" aria-labelledby="cta-title">
      <h2 id="cta-title">Empieza con una versión imperfecta.</h2>
      <NuxtLink class="button button-dark" to="/editor">Abrir el editor</NuxtLink>
    </section>

    <footer>
      <span>Fanzines</span>
      <span>beta.fanzines.app</span>
    </footer>
  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(html) {
  background: #f6f0df;
  scroll-behavior: smooth;
}

:global(body) {
  margin: 0;
  min-width: 320px;
  background:
    linear-gradient(rgba(12, 11, 9, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(12, 11, 9, 0.025) 1px, transparent 1px),
    #f6f0df;
  background-size: 26px 26px;
  color: #14120f;
  font-family: 'Special Elite', 'Courier New', monospace;
}

:global(a) {
  color: inherit;
  text-decoration: none;
}

.home-page {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
}

.home-page::before {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  content: '';
  opacity: 0.32;
  background:
    radial-gradient(circle at 24% 12%, rgba(255, 72, 44, 0.22), transparent 22rem),
    radial-gradient(circle at 82% 48%, rgba(48, 106, 160, 0.16), transparent 24rem);
}

.site-header,
.hero,
.definition,
.making,
.final-cta,
footer {
  position: relative;
  z-index: 1;
  width: min(1180px, calc(100% - 36px));
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
  font-family: 'Patrick Hand', 'Comic Sans MS', cursive;
  font-size: clamp(1.65rem, 3vw, 2.2rem);
  font-weight: 400;
  transform: rotate(-2deg);
}

.site-header nav {
  display: flex;
  align-items: center;
  gap: clamp(12px, 2.4vw, 28px);
  font-size: 0.94rem;
}

.site-header a {
  text-decoration-thickness: 2px;
  text-underline-offset: 5px;
}

.site-header a:hover {
  text-decoration-line: underline;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 0.82fr) minmax(360px, 1fr);
  gap: clamp(34px, 6vw, 86px);
  align-items: center;
  min-height: calc(86svh - 92px);
  padding: 24px 0 48px;
}

.hero-copy h1 {
  max-width: 760px;
  margin: 0;
  font-family: Impact, 'Arial Black', sans-serif;
  font-size: clamp(3.6rem, 7.4vw, 7.5rem);
  font-weight: 900;
  line-height: 0.88;
  letter-spacing: 0;
  text-transform: uppercase;
}

.hero-copy p,
.definition p,
.making-intro p {
  max-width: 620px;
  margin: 28px 0 0;
  font-size: clamp(1.06rem, 1.5vw, 1.28rem);
  line-height: 1.55;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 34px;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  padding: 0 20px;
  border: 2px solid #14120f;
  color: #14120f;
  font-family: 'Special Elite', 'Courier New', monospace;
  font-size: 0.98rem;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.button:hover {
  transform: translate(-3px, -3px) rotate(-1deg);
  box-shadow: 5px 5px 0 #14120f;
}

.button-dark {
  background: #14120f;
  color: #fffaf0;
}

.button-light {
  background: #fffaf0;
}

.hero-board {
  position: relative;
  min-height: 600px;
}

.photo {
  display: block;
  overflow: hidden;
  border: 10px solid #fffaf0;
  background: #fffaf0;
  box-shadow: 10px 14px 0 rgba(20, 18, 15, 0.9);
  object-fit: cover;
}

.photo-main {
  width: min(690px, 100%);
  aspect-ratio: 1.3;
  transform: rotate(2deg);
}

.photo-small {
  position: absolute;
  right: 2%;
  bottom: 18px;
  width: min(250px, 44%);
  aspect-ratio: 0.64;
  transform: rotate(-7deg);
}

.tape-note {
  position: absolute;
  left: -10px;
  bottom: 42px;
  width: min(280px, 58%);
  margin: 0;
  padding: 12px 16px;
  background: #ff4c2e;
  color: #14120f;
  font-family: 'Patrick Hand', 'Comic Sans MS', cursive;
  font-size: clamp(1.25rem, 2.4vw, 1.72rem);
  line-height: 1;
  transform: rotate(3deg);
  box-shadow: 6px 6px 0 #14120f;
}

.definition {
  display: grid;
  grid-template-columns: minmax(0, 0.78fr) minmax(300px, 0.72fr);
  gap: clamp(32px, 6vw, 86px);
  align-items: center;
  padding: clamp(44px, 7vw, 96px) 0 clamp(76px, 10vw, 130px);
  border-top: 2px dashed rgba(20, 18, 15, 0.5);
}

.definition h2,
.making h2,
.final-cta h2 {
  margin: 0;
  font-family: Impact, 'Arial Black', sans-serif;
  font-size: clamp(2.8rem, 5.8vw, 6rem);
  line-height: 0.9;
  letter-spacing: 0;
  text-transform: uppercase;
}

.table-photo {
  margin: 0;
  transform: rotate(-2deg);
}

.table-photo img {
  display: block;
  width: 100%;
  max-height: 580px;
  border: 10px solid #fffaf0;
  box-shadow: 8px 10px 0 #14120f;
  object-fit: cover;
}

.table-photo figcaption {
  width: fit-content;
  max-width: 92%;
  margin: -18px 0 0 16px;
  padding: 10px 14px;
  background: #d8ff42;
  font-family: 'Patrick Hand', 'Comic Sans MS', cursive;
  font-size: 1.18rem;
  transform: rotate(2deg);
}

.making {
  padding: clamp(70px, 10vw, 128px) 0;
  border-top: 2px dashed rgba(20, 18, 15, 0.5);
}

.making-intro {
  display: grid;
  grid-template-columns: minmax(0, 0.62fr) minmax(260px, 0.38fr);
  gap: 34px;
  align-items: end;
  margin-bottom: 34px;
}

.fold-layout {
  display: grid;
  grid-template-columns: minmax(320px, 0.86fr) minmax(280px, 0.58fr);
  gap: clamp(22px, 4vw, 54px);
  align-items: stretch;
  padding: clamp(16px, 3vw, 32px);
  border: 2px solid #14120f;
  background: #fffaf0;
  box-shadow: 10px 10px 0 #14120f;
}

.fold-layout img {
  width: 100%;
  height: 100%;
  min-height: 340px;
  object-fit: contain;
  mix-blend-mode: multiply;
}

.fold-layout ol {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: steps;
}

.fold-layout li {
  position: relative;
  padding: 18px 18px 18px 58px;
  border: 2px solid #14120f;
  background: #f6f0df;
  counter-increment: steps;
}

.fold-layout li::before {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 28px;
  height: 28px;
  border: 2px solid #14120f;
  border-radius: 50%;
  content: counter(steps);
  display: grid;
  place-items: center;
  font-family: 'Patrick Hand', 'Comic Sans MS', cursive;
  font-size: 1.2rem;
}

.fold-layout strong,
.fold-layout span {
  display: block;
}

.fold-layout strong {
  font-size: 1.08rem;
}

.fold-layout span {
  margin-top: 8px;
  line-height: 1.45;
}

.final-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  padding: clamp(56px, 8vw, 96px) 0;
  border-top: 2px dashed rgba(20, 18, 15, 0.5);
}

.final-cta h2 {
  max-width: 820px;
}

footer {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 28px 0 36px;
  border-top: 2px solid #14120f;
  font-size: 0.95rem;
}

@media (max-width: 920px) {
  .hero,
  .definition,
  .making-intro,
  .fold-layout {
    grid-template-columns: 1fr;
  }

  .hero {
    min-height: auto;
  }

  .hero-board {
    min-height: 460px;
  }
}

@media (max-width: 620px) {
  .site-header {
    align-items: flex-start;
  }

  .site-header nav {
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }

  .hero-copy h1 {
    font-size: clamp(3.1rem, 16vw, 4.8rem);
  }

  .hero-copy p,
  .definition p,
  .making-intro p {
    font-size: 1rem;
  }

  .actions,
  .final-cta {
    align-items: stretch;
    flex-direction: column;
  }

  .button {
    width: 100%;
  }

  .hero-board {
    min-height: 390px;
  }

  .photo {
    border-width: 7px;
    box-shadow: 6px 8px 0 #14120f;
  }

  .photo-main {
    aspect-ratio: 1;
  }

  .photo-small {
    right: -6px;
    width: 46%;
  }

  .tape-note {
    left: 0;
    bottom: 22px;
    width: 68%;
  }

  .fold-layout {
    padding: 14px;
    box-shadow: 6px 6px 0 #14120f;
  }

  .fold-layout img {
    min-height: 260px;
  }

  footer {
    flex-direction: column;
  }
}
</style>

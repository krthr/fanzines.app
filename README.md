# Fanzines

[![CI](https://github.com/krthr/fanzines.app/actions/workflows/ci.yml/badge.svg)](https://github.com/krthr/fanzines.app/actions/workflows/ci.yml)
[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js&logoColor=white)](https://vuejs.org)
[![Node](https://img.shields.io/badge/Node-26-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-f38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-blue)](#licencia)

> Editor en el navegador para crear, imprimir y exportar fanzines A4 plegables.

Fanzines es una aplicación web para diseñar un fanzine de **ocho paneles** sobre una hoja **A4** plegable: colocas textos e imágenes en cada panel, revisas el pliego completo y exportas un **PDF listo para imprimir, cortar y doblar**. Todo ocurre en el navegador; no se sube nada a ningún servidor.

- **Web:** [fanzines.app](https://fanzines.app) · en inglés: [fanzines.app/en](https://fanzines.app/en)
- **Editor:** [fanzines.app/editor](https://fanzines.app/editor) · en inglés: [fanzines.app/en/editor](https://fanzines.app/en/editor)
- **Autor:** [Wilson Tovar](https://krthr.co) · [Instagram @wilson__tovar](https://www.instagram.com/wilson__tovar/)

## Capturas

<table>
  <tr>
    <td width="50%" align="center"><img src="public/images/folded-zine.webp" alt="Fanzine desplegado sobre una mesa"><br><sub>Fanzine desplegado</sub></td>
    <td width="50%" align="center"><img src="public/images/hand-zine.webp" alt="Fanzine pequeño abierto en una mano"><br><sub>Fanzine en la mano</sub></td>
  </tr>
  <tr>
    <td width="50%" align="center"><img src="public/images/making-table.webp" alt="Mesa de trabajo con fotos impresas, cutter, regla y tijeras"><br><sub>Mesa de trabajo</sub></td>
    <td width="50%" align="center"><img src="public/images/fold-guide.webp" alt="Instrucciones dibujadas a mano para doblar, cortar y abrir un fanzine"><br><sub>Guía de plegado</sub></td>
  </tr>
</table>

## Características

- **Editor de 8 paneles con imposición A4.** Portada, contraportada y 6 páginas interiores, colocadas automáticamente en la rejilla de impresión (4 columnas × 2 filas) con las rotaciones correctas para el plegado.
- **Texto e imágenes.** Sube fotos (una a una o por lotes) **arrastrándolas al lienzo, a una miniatura de página o a la ventana**, o desde el botón de carga, y escribe directamente sobre el lienzo. Cada elemento se puede **mover, girar, escalar, ajustar opacidad, reordenar (z-order) y alinear** dentro del panel.
- **Edición de texto en línea.** Haz clic en un cuadro de texto y escribe sobre el lienzo.
- **Carga por lotes con auto-optimización.** Al importar varias imágenes, se reparten entre las páginas disponibles y se reducen automáticamente si superan los 2400 px en el lado mayor.
- **Páginas en orden de lectura.** La barra lateral muestra miniaturas en vivo agrupadas como se leen (Portada, 1|2, 3|4, 5|6, Contraportada) y el lienzo puede enseñar la página enfrentada.
- **Revisión del pliego.** Antes de descargar, el paso «Revisar» muestra la hoja A4 completa con los 8 paneles y las opciones del PDF.
- **Exportación PDF a 300 DPI.** El PDF sale impuesto para una hoja A4 horizontal, con **guías de corte y doblez** opcionales y **márgenes de seguridad**.
- **Guías de previsualización.** Activa/desactiva el margen seguro de 5 mm sobre el lienzo mientras diseñas.
- **En español e inglés.** Español (Colombia) en `/` y `/editor`; inglés (Estados Unidos) en `/en` y `/en/editor`. Cada página enlaza a su versión en el otro idioma y el fanzine que estés haciendo se conserva al cambiar.
- **Analítica opcional con PostHog.** Solo se activa si se define la clave de API; captura eventos de uso y errores, sin grabación de sesión.
- **SEO listo.** Sitemap, robots, metadatos Open Graph/Twitter, `hreflang` por idioma y JSON-LD `WebApplication` mediante `@nuxtjs/seo` y `@nuxtjs/i18n`.
- **Accesible y responsive.** Skip link, foco visible, `prefers-reduced-motion` y diseño adaptado a móvil.

## Tecnologías

| Área | Herramienta |
| --- | --- |
| Framework | [Nuxt 4](https://nuxt.com) · [Vue 3](https://vuejs.org) |
| UI | [@nuxt/ui](https://ui.nuxt.com) v4 · [Tailwind CSS](https://tailwindcss.com) v4 · [Iconify (lucide)](https://iconify.design) |
| Lienzo / editor | [Konva](https://konvajs.org) · [vue-konva](https://github.com/konvajs/vue-konva) |
| Exportación PDF | [jsPDF](https://github.com/parallax/jsPDF) |
| Animaciones | [GSAP](https://gsap.com) + ScrollTrigger |
| Imágenes / fuentes | [@nuxt/image](https://image.nuxt.com) · [@nuxt/fonts](https://fonts.nuxt.com) |
| SEO | [@nuxtjs/seo](https://nuxtseo.com) |
| Idiomas | [@nuxtjs/i18n](https://i18n.nuxtjs.org) |
| Scripts / analítica | [@nuxt/scripts](https://scripts.nuxt.com) · [PostHog](https://posthog.com) |
| Despliegue | [Cloudflare Workers](https://workers.cloudflare.com) · [Wrangler](https://developers.cloudflare.com/workers/wrangler/) |

## Requisitos

- **Node.js 26** (versión fijada en [`.nvmrc`](./.nvmrc)). Si usas `nvm`:

  ```bash
  nvm use
  ```

## Instalación y desarrollo

```bash
npm ci
npm run dev
```

El servidor de desarrollo arranca en **http://localhost:3000**. El editor está en `/editor`.

### Variables de entorno

PostHog es **opcional** y para desarrollar no hace falta. Para activar la analítica, copia [`.env.example`](.env.example) a `.env` y pon la clave pública:

```bash
NUXT_PUBLIC_SCRIPTS_POSTHOG_API_KEY=tu_clave_publica
```

Sin esta variable, la analítica permanece desactivada.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en `http://localhost:3000` |
| `npm run build` | Compila la app para producción (salida en `.output/`) |
| `npm run generate` | Genera el sitio estático |
| `npm run preview` | Previsualiza localmente el build de producción |
| `npm run typecheck` | Comprueba los tipos con `vue-tsc` |
| `npm run analyze` | Analiza el bundle de la app sin servir |
| `npm run postinstall` | Prepara tipos de Nuxt (`nuxt prepare`, se ejecuta tras `npm install`) |

## Estructura del proyecto

```
fanzines/
├── app/
│   ├── app.vue                     # Raíz: UApp + JSON-LD WebApplication
│   ├── app.config.ts               # Tema @nuxt/ui (colores y estilo de los avisos)
│   ├── error.vue                   # Página de error
│   ├── assets/css/main.css         # Tokens de marca (landing, error y editor) y piezas base del editor
│   ├── components/
│   │   └── LocaleSwitch.vue        # Enlace a la misma página en el otro idioma
│   ├── components/zine/
│   │   ├── ZineEditor.client.vue   # Editor: barra superior, modos Diseñar y Revisar, versión móvil
│   │   ├── EditorBrand.vue         # Marca y H1, compartidos con el fallback prerenderizado
│   │   ├── PagesSidebar.vue        # Barra de páginas: pliegos de lectura o vista del pliego
│   │   ├── PageStrip.vue           # Tira de páginas (móvil)
│   │   ├── PageMini.vue            # Miniatura de una página
│   │   ├── ZinePageRender.vue      # Render en vivo de una página (miniaturas y página enfrentada)
│   │   ├── PageCanvas.vue          # Lienzo Konva: página activa, página enfrentada y barra flotante
│   │   ├── DropOverlay.vue         # Aviso al arrastrar archivos sobre el editor
│   │   ├── ElementInspector.vue    # Panel de propiedades del elemento
│   │   ├── MobileBar.vue           # Barra de acciones (móvil)
│   │   ├── SheetPreview.vue        # Pliego A4 impuesto (barra lateral y revisión)
│   │   ├── ReviewPanel.vue         # Revisión y opciones del PDF
│   │   ├── PdfReadyDialog.vue      # Diálogo «Tu fanzine está listo»
│   │   ├── FlowSteps.vue           # Pasos Diseñar → Revisar → Imprimir y doblar
│   │   └── ZineToggle.vue          # Interruptor
│   ├── composables/
│   │   ├── useZineStore.ts                  # Estado del fanzine (useState)
│   │   ├── useZineEditorView.client.ts      # Estado de la vista: modo, página enfrentada, páginas con contenido
│   │   ├── useZineElementActions.client.ts  # Acciones sobre el elemento seleccionado
│   │   ├── useZineExport.client.ts          # Exportación del PDF y su estado
│   │   ├── useZineImageImport.client.ts     # Importación de imágenes
│   │   ├── usePageTileDrop.client.ts        # Soltar archivos sobre una miniatura
│   │   ├── useZineDragState.client.ts       # Estado de arrastre
│   │   ├── useZineAnalytics.client.ts       # Eventos PostHog
│   │   ├── useTrackedZinePageSelection.client.ts
│   │   ├── useZinePageLabels.ts             # Nombres de las páginas en el idioma actual
│   │   └── useLocalizedImage.ts             # Imágenes con texto: la versión del idioma actual
│   ├── utils/
│   │   ├── zineLayout.ts            # Geometría A4, imposición, orden de lectura y conversión a mm y pt
│   │   ├── renderZine.client.ts     # Render de elementos a Konva
│   │   ├── renderPage.client.ts     # Render de una página a canvas
│   │   ├── renderSheet.client.ts    # Render del pliego completo a canvas
│   │   ├── exportPdf.client.ts      # Generación del PDF con jsPDF
│   │   ├── zineImageCache.ts        # Caché de imágenes HTML
│   │   └── textLines.ts             # Títulos de varias líneas a partir de un mensaje
│   ├── types/zine.ts               # Tipos: PageId, ZineElement, ZineState…
│   ├── plugins/posthog-errors.client.ts
│   └── pages/
│       ├── index.vue               # Landing
│       └── editor.vue              # Página del editor y su fallback prerenderizado
├── i18n/locales/
│   ├── es-CO.json                  # Textos en español (idioma por defecto)
│   └── en-US.json                  # Textos en inglés
├── public/
│   ├── favicon.ico · favicon.svg
│   ├── _robots.txt
│   └── images/                     # Fotos y guías (webp); las que llevan texto tienen gemela -en
├── .github/                        # CI, plantillas de issues y PR, Dependabot
├── nuxt.config.ts                  # Módulos, SEO, idiomas, fuentes, iconos, routeRules
├── wrangler.jsonc                  # Configuración de Cloudflare Workers (dominios)
├── DESIGN.md                       # Sistema de diseño: colores, tipografía, componentes
├── CONTRIBUTING.md                 # Guía para contribuir (en inglés)
├── .env.example                    # Variables de entorno (todas opcionales)
├── .nvmrc                          # Node 26
└── package.json
```

## Arquitectura

### Estado del fanzine

El estado vive en `useState<ZineState>` a través de [`useZineStore`](app/composables/useZineStore.ts). Contiene la página seleccionada, el elemento seleccionado, el mapa de elementos y el orden por página. Las imágenes se guardan como `blob:` URLs y se liberan (`URL.revokeObjectURL`) al eliminarlas o reiniciar.

Lo que solo afecta a cómo se ve el editor (modo Diseñar o Revisar, página sola o doble, pestaña de la barra lateral, diálogo del PDF) vive aparte, en [`useZineEditorView`](app/composables/useZineEditorView.client.ts), y no forma parte del fanzine. «Revisar» es un modo dentro de `/editor`, no otra ruta, porque el fanzine solo existe en memoria.

### Geometría e imposición

[`zineLayout.ts`](app/utils/zineLayout.ts) define el formato A4 (297 × 210 mm) y el mapeo de las 8 páginas a una rejilla de 4 columnas × 2 filas. Un panel mide 74,25 × 105 mm; el estado trabaja en unidades de página (`PAGE_W` = 1000) y la interfaz siempre muestra milímetros (y puntos para el tamaño del texto). Los paneles superiores van rotados 180° para que, tras imprimir por una cara, cortar la línea central y plegar, el fanzine se lea en orden:

```
┌─────┬─────┬─────┬─────┐
│  6  │  5  │  4  │  3  │   ← rotados 180°
├─────┼─────┼─────┼─────┤
│Contra│Port.│  1  │  2 │   ← sin rotar
└─────┴─────┴─────┴─────┘
```

### Renderizado

El lienzo del editor usa **Konva** vía `vue-konva`. Las miniaturas y la página enfrentada se dibujan con [`renderPage.client.ts`](app/utils/renderPage.client.ts), que usa los mismos nodos que el pliego y el PDF. Para exportar, [`renderSheet.client.ts`](app/utils/renderSheet.client.ts) monta un `Stage` fuera de pantalla con todos los paneles impuestos y devuelve un canvas; [`exportPdf.client.ts`](app/utils/exportPdf.client.ts) lo incrusta en un PDF A4 horizontal con **jsPDF** a 300 DPI, añadiendo las guías de corte/doblez y los márgenes de seguridad si están activados.

### Idiomas

La app está en español de Colombia (`es-CO`, el idioma por defecto) y en inglés de Estados Unidos (`en-US`), con [`@nuxtjs/i18n`](https://i18n.nuxtjs.org). El idioma es parte de la URL: el español conserva las rutas de siempre (`/`, `/editor`) y el inglés vive bajo `/en` (`/en`, `/en/editor`).

- **Textos.** Todo lo que se lee está en [`i18n/locales/es-CO.json`](i18n/locales/es-CO.json) y [`i18n/locales/en-US.json`](i18n/locales/en-US.json), con las mismas claves. En los componentes se usa `t('clave')`. Un texto con `|` tiene singular y plural (`"Suelta la foto | Suelta las {count} fotos"`), así que una barra literal no puede ir en un mensaje. Un título de varias líneas es un solo mensaje con saltos de línea (`\n`), que [`toLines`](app/utils/textLines.ts) reparte.
- **Nombres de las páginas.** «Portada», «Página 1» o «la contraportada» salen de [`useZinePageLabels`](app/composables/useZinePageLabels.ts), no de constantes.
- **Enlaces.** Los enlaces internos usan `<NuxtLinkLocale>` (o `useLocalePath`) para quedarse en el idioma actual. [`LocaleSwitch`](app/components/LocaleSwitch.vue) lleva a la misma página en el otro idioma; en el editor el fanzine se conserva, porque el estado vive en `useState`.
- **Imágenes con texto.** La captura del editor, la guía de plegado y la imagen para redes tienen una gemela en inglés con el sufijo `-en` (`fold-guide.webp` y `fold-guide-en.webp`). [`useLocalizedImage`](app/composables/useLocalizedImage.ts) elige la que toca.
- **Sin redirección por idioma del navegador.** Las páginas están prerenderizadas y se sirven antes de que se ejecute el Worker, así que solo se podría redirigir en el cliente, con la página en español ya pintada, y Googlebot (que renderiza como `en-US`) acabaría fuera de las páginas en español. Los buscadores eligen la versión con `hreflang` y las personas con el enlace de idioma.

Para añadir un idioma: un archivo nuevo en `i18n/locales/`, su entrada en `i18n.locales` y sus rutas en `routeRules` y `nitro.prerender.routes` de [`nuxt.config.ts`](nuxt.config.ts), y las imágenes gemelas. `LocaleSwitch` y `useLocalizedImage` dan por hecho que hay dos idiomas.

### SEO y rutas

`@nuxtjs/seo` gestiona sitemap, robots y metadatos. En [`nuxt.config.ts`](nuxt.config.ts), `routeRules` prerenderiza `/`, `/editor`, `/en` y `/en/editor`, y `site` define la URL canónica `https://fanzines.app`. Cada página declara su idioma (`<html lang>`), su URL canónica, `og:locale` y un `hreflang` por idioma desde [`app.vue`](app/app.vue), que también inyecta el JSON-LD `WebApplication`. `sitemap.xml` es uno solo, con las cuatro URL y sus alternativas.

### Analítica

Los eventos se capturan solo si `NUXT_PUBLIC_SCRIPTS_POSTHOG_API_KEY` está definida. [`useZineAnalytics.client.ts`](app/composables/useZineAnalytics.client.ts) envía eventos como `zine_pdf_export_started`, `zine_images_uploaded`, etc., cada uno con el idioma (`locale`), y [`posthog-errors.client.ts`](app/plugins/posthog-errors.client.ts) captura excepciones no controladas.

## Despliegue

El proyecto se despliega en **Cloudflare Workers** con [`wrangler.jsonc`](wrangler.jsonc) (dominios personalizados `fanzines.app` y `www.fanzines.app`, flag `nodejs_compat`, observabilidad activada).

El Worker de producción es `fanzines-app` y lo despliega **Workers Builds** en cada push a `main` (las demás ramas de este repositorio suben versiones de preview; los PR desde forks no, y por eso el [CI](.github/workflows/ci.yml) compila el Worker en cada PR). El `name` de `wrangler.jsonc` tiene que coincidir con ese nombre: si no, un `wrangler deploy` manual crearía otro Worker y le movería los dominios.

La URL canónica es `https://fanzines.app`. Las redirecciones se configuran en la zona de Cloudflare, no en el código, porque las páginas prerenderizadas y los archivos estáticos se sirven antes de que se ejecute el Worker:

- **Redirect Rule** (Rules → Redirect Rules): `www.fanzines.app` y `http://fanzines.app` → `https://fanzines.app` + ruta, 301, conservando la query string, en un solo salto.
- **Always Use HTTPS** y **HSTS** (SSL/TLS → Edge Certificates).

En local, `npm run build` usa el preset de Node. Para compilar exactamente lo que despliega Workers Builds (el preset `cloudflare_module` y la configuración de Wrangler que genera Nitro, con el binding `ASSETS`), define `WORKERS_CI`:

```bash
WORKERS_CI=1 npm run build
npx wrangler dev      # probar el Worker en local
npx wrangler deploy   # despliegue manual; normalmente no hace falta
```

Sin `WORKERS_CI`, `npx wrangler deploy` falla con «Missing entry-point», y pasarle la ruta del Worker a mano despliega sin el binding `ASSETS` ni los flags que añade Nitro.

Consulta la [documentación de despliegue de Nuxt](https://nuxt.com/docs/getting-started/deployment) para otros destinos.

## Contribuir

Las contribuciones son bienvenidas, en español o en inglés. La guía está en [`CONTRIBUTING.md`](CONTRIBUTING.md) (en inglés): cómo preparar el entorno, las convenciones de código, textos y diseño, cómo comprobar un cambio y cómo abrir un PR. Para cambios grandes, abre antes un issue.

- [Código de conducta](CODE_OF_CONDUCT.md)
- [Política de seguridad](SECURITY.md): los problemas de seguridad se reportan en privado, no en un issue.

## Licencia

[MIT](./LICENSE) © 2026 [Wilson Tovar](https://krthr.co) · [Instagram @wilson__tovar](https://www.instagram.com/wilson__tovar/)

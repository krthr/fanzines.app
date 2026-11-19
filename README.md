# Fanzines

[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js&logoColor=white)](https://vuejs.org)
[![Node](https://img.shields.io/badge/Node-26-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-f38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-blue)](#licencia)

> Editor en el navegador para crear, imprimir y exportar fanzines A4 plegables.

Fanzines es una aplicación web para diseñar un fanzine de **ocho paneles** sobre una hoja **A4** plegable: colocas textos e imágenes en cada panel, revisas el pliego completo y exportas un **PDF listo para imprimir, cortar y doblar**. Todo ocurre en el navegador; no se sube nada a ningún servidor.

- **Web:** [fanzines.app](https://fanzines.app)
- **Editor:** [fanzines.app/editor](https://fanzines.app/editor)
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
- **Analítica opcional con PostHog.** Solo se activa si se define la clave de API; captura eventos de uso y errores, sin grabación de sesión.
- **SEO listo.** Sitemap, robots, metadatos Open Graph/Twitter y JSON-LD `WebApplication` mediante `@nuxtjs/seo`.
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
| Scripts / analítica | [@nuxt/scripts](https://scripts.nuxt.com) · [PostHog](https://posthog.com) |
| Despliegue | [Cloudflare Workers](https://workers.cloudflare.com) · [Wrangler](https://developers.cloudflare.com/workers/wrangler/) |

## Requisitos

- **Node.js 26** (versión fijada en [`.nvmrc`](./.nvmrc)). Si usas `nvm`:

  ```bash
  nvm use
  ```

## Instalación y desarrollo

```bash
npm install
npm run dev
```

El servidor de desarrollo arranca en **http://localhost:3000**. El editor está en `/editor`.

### Variables de entorno

PostHog es **opcional**. Para activar la analítica, define la clave pública en el entorno (por ejemplo en `.env`):

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
│   │   └── useTrackedZinePageSelection.client.ts
│   ├── utils/
│   │   ├── zineLayout.ts            # Geometría A4, imposición, orden de lectura y conversión a mm y pt
│   │   ├── renderZine.client.ts     # Render de elementos a Konva
│   │   ├── renderPage.client.ts     # Render de una página a canvas
│   │   ├── renderSheet.client.ts    # Render del pliego completo a canvas
│   │   ├── exportPdf.client.ts      # Generación del PDF con jsPDF
│   │   └── zineImageCache.ts        # Caché de imágenes HTML
│   ├── types/zine.ts               # Tipos: PageId, ZineElement, ZineState…
│   ├── plugins/posthog-errors.client.ts
│   └── pages/
│       ├── index.vue               # Landing
│       └── editor.vue              # Página del editor y su fallback prerenderizado
├── public/
│   ├── favicon.ico · favicon.svg
│   ├── _robots.txt
│   └── images/                     # Fotos y guías (webp)
├── nuxt.config.ts                  # Módulos, SEO, fuentes, iconos, routeRules
├── wrangler.jsonc                  # Configuración de Cloudflare Workers (dominios)
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

### SEO y rutas

`@nuxtjs/seo` gestiona sitemap, robots y metadatos. En [`nuxt.config.ts`](nuxt.config.ts), `routeRules` prerenderiza `/` e `/editor`, y `site` define la URL canónica `https://fanzines.app`. El JSON-LD `WebApplication` se inyecta desde [`app.vue`](app/app.vue).

### Analítica

Los eventos se capturan solo si `NUXT_PUBLIC_SCRIPTS_POSTHOG_API_KEY` está definida. [`useZineAnalytics.client.ts`](app/composables/useZineAnalytics.client.ts) envía eventos como `zine_pdf_export_started`, `zine_images_uploaded`, etc., y [`posthog-errors.client.ts`](app/plugins/posthog-errors.client.ts) captura excepciones no controladas.

## Despliegue

El proyecto se despliega en **Cloudflare Workers** con [`wrangler.jsonc`](wrangler.jsonc) (dominios personalizados `fanzines.app` y `www.fanzines.app`, flag `nodejs_compat`, observabilidad activada).

El Worker de producción es `fanzines-app` y lo despliega **Workers Builds** en cada push a `main` (las demás ramas suben versiones de preview). El `name` de `wrangler.jsonc` tiene que coincidir con ese nombre: si no, un `wrangler deploy` manual crearía otro Worker y le movería los dominios.

La URL canónica es `https://fanzines.app`. Las redirecciones se configuran en la zona de Cloudflare, no en el código, porque las páginas prerenderizadas y los archivos estáticos se sirven antes de que se ejecute el Worker:

- **Redirect Rule** (Rules → Redirect Rules): `www.fanzines.app` y `http://fanzines.app` → `https://fanzines.app` + ruta, 301, conservando la query string, en un solo salto.
- **Always Use HTTPS** y **HSTS** (SSL/TLS → Edge Certificates).

```bash
npm run build
npx wrangler deploy
```

Para desarrollo local con el entorno de Workers:

```bash
npx wrangler dev
```

Consulta la [documentación de despliegue de Nuxt](https://nuxt.com/docs/getting-started/deployment) para otros destinos.

## Contribuir

1. Haz un fork del repositorio.
2. Crea una rama para tu cambio: `git checkout -b mi-mejora`.
3. Sigue las convenciones existentes (TypeScript, estilo de los componentes en `app/components/zine/`, sin dependencias innecesarias).
4. Abre un Pull Request describiendo el cambio.

## Licencia

[MIT](./LICENSE) © 2026 [Wilson Tovar](https://krthr.co) · [Instagram @wilson__tovar](https://www.instagram.com/wilson__tovar/)

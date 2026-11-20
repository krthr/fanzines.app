// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@nuxtjs/seo', '@nuxt/image', '@nuxt/fonts', '@nuxt/scripts'],
  runtimeConfig: {
    public: {
      scripts: {
        posthog: {
          apiKey: process.env.NUXT_PUBLIC_SCRIPTS_POSTHOG_API_KEY || ''
        }
      }
    }
  },
  app: {
    head: {
      // <html lang> is set per locale by useLocaleHead in app.vue and error.vue.
      link: [
        { rel: 'icon', type: 'image/x-icon', sizes: 'any', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },
  css: ['~/assets/css/main.css'],
  site: {
    url: 'https://fanzines.app',
    name: 'Fanzines',
    // What build-time files (llms.txt) use. On a page, i18n overrides it with the
    // `nuxtSiteConfig.description` message of the current locale.
    description: 'Editor en el navegador para crear, imprimir y exportar fanzines A4 plegables.'
  },
  i18n: {
    baseUrl: 'https://fanzines.app',
    // Spanish keeps the URLs it always had (/, /editor); English lives under /en.
    strategy: 'prefix_except_default',
    defaultLocale: 'es',
    locales: [
      { code: 'es', language: 'es-CO', name: 'Español', file: 'es-CO.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en-US.json' }
    ],
    // Pages are prerendered and served before the Worker runs, so a redirect by browser
    // language could only happen in the client, after the Spanish page has painted, and
    // Googlebot (which renders as en-US) would be sent away from the Spanish pages.
    // The language is the URL: hreflang tells search engines, the switcher tells people.
    detectBrowserLanguage: false
  },
  sitemap: {
    // One sitemap.xml for both languages, each URL with its hreflang alternates. Without
    // this, i18n splits it into an index with a sitemap per locale.
    sitemaps: false,
    urls: ['/', '/editor']
  },
  robots: {
    sitemap: ['https://fanzines.app/sitemap.xml']
  },
  image: {
    // ipxStatic registers no /_ipx handler under `nuxt dev`, so every image 404s there.
    provider: process.env.NODE_ENV === 'development' ? 'ipx' : 'ipxStatic',
    format: ['webp'],
    screens: {
      xs: 320,
      sm: 500,
      md: 760,
      lg: 1040,
      xl: 1240
    }
  },
  fonts: {
    families: [
      { name: 'Anton', weights: [400] },
      { name: 'Outfit', weights: [400, 500, 600, 700, 800, 900] },
      { name: 'Special Elite', weights: [400] },
      // The labels FoldGuide writes on the drawing. Only the PDF dialog uses it.
      { name: 'Coming Soon', weights: [400], preload: false }
    ]
  },
  ogImage: {
    enabled: false
  },
  // Serves llms.txt, llms-full.txt, sitemap.md and a .md twin of each page.
  aiReady: {
    enabled: true
  },
  // On by default in Nuxt SEO v6; it registers a service worker and wraps the Worker entry.
  skewProtection: false,
  routeRules: {
    '/': { prerender: true },
    '/editor': { prerender: true, robots: true },
    '/en': { prerender: true },
    '/en/editor': { prerender: true, robots: true }
  },
  nitro: {
    experimental: {
      // Required for the Cloudflare build. AI Ready converts HTML to Markdown with mdream,
      // whose workerd build imports a .wasm file; without this, Rollup fails to parse it.
      wasm: true
    },
    prerender: {
      // AI Ready only indexes pages at build time (llms-full.txt, sitemap.md, .md twins)
      // when routes are listed here; it ignores `prerender: true` in routeRules.
      routes: ['/', '/editor', '/en', '/en/editor'],
      // Emit editor.html (not editor/index.html) so Cloudflare assets serve /editor
      // without a 307 to /editor/, matching the canonical and sitemap URLs.
      autoSubfolderIndex: false
    }
  },
  scripts: {
    registry: {
      posthog: {
        trigger: 'onNuxtReady',
        autocapture: false,
        capturePageview: 'history_change',
        disableSessionRecording: true,
        config: {
          defaults: '2026-01-30',
          capture_exceptions: {
            capture_unhandled_errors: true,
            capture_unhandled_rejections: true,
            capture_console_errors: false
          }
        }
      }
    }
  },
  vite: {
    optimizeDeps: {
      include: [
        'vue-konva',
        'vue-konva/core',
        'jspdf',
        'konva',
        'konva/lib/Group',
        'konva/lib/Layer',
        'konva/lib/Stage',
        'konva/lib/shapes/Image',
        'konva/lib/shapes/Rect',
        'konva/lib/shapes/Text',
        'konva/lib/shapes/Transformer',
        'gsap',
        'gsap/ScrollTrigger',
        '@unhead/schema-org/vue'
      ]
    }
  },
  icon: {
    serverBundle: {
      collections: ['lucide']
    },
    clientBundle: {
      scan: {
        globInclude: ['app/**/*.{vue,ts}']
      },
      sizeLimitKb: 64
    }
  },
  ui: {
    colorMode: false,
    fonts: false
  },
  typescript: {
    tsConfig: {
      include: ['../test/unit/**/*']
    },
    nodeTsConfig: {
      include: ['../vitest.config.ts']
    }
  }
})

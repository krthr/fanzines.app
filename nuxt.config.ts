// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxt/ui', '@nuxtjs/seo', '@nuxt/image', '@nuxt/fonts'],
  app: {
    head: {
      htmlAttrs: {
        lang: 'es'
      },
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },
  css: ['~/assets/css/main.css'],
  site: {
    url: 'https://fanzines.app',
    name: 'Fanzines',
    description: 'Editor en el navegador para crear, imprimir y exportar fanzines A4 plegables.',
    defaultLocale: 'es'
  },
  sitemap: {
    urls: ['/', '/editor']
  },
  robots: {
    sitemap: ['https://fanzines.app/sitemap.xml']
  },
  image: {
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
      { name: 'Outfit', weights: [400, 600, 700, 800, 900] },
      { name: 'Special Elite', weights: [400] }
    ]
  },
  ogImage: {
    enabled: false
  },
  routeRules: {
    '/': { prerender: true },
    '/editor': { prerender: true, robots: true }
  },
  vite: {
    optimizeDeps: {
      include: ['vue-konva', 'jspdf', 'konva', 'gsap', 'gsap/ScrollTrigger', '@unhead/schema-org/vue']
    }
  },
  icon: {
    serverBundle: {
      collections: ['lucide']
    },
    clientBundle: {
      scan: false,
      icons: [
        'lucide:align-center',
        'lucide:align-horizontal-justify-center',
        'lucide:align-horizontal-justify-end',
        'lucide:align-horizontal-justify-start',
        'lucide:align-left',
        'lucide:align-right',
        'lucide:align-vertical-justify-center',
        'lucide:align-vertical-justify-end',
        'lucide:align-vertical-justify-start',
        'lucide:bring-to-front',
        'lucide:download',
        'lucide:expand',
        'lucide:image-plus',
        'lucide:info',
        'lucide:maximize',
        'lucide:refresh-cw',
        'lucide:send-to-back',
        'lucide:sliders-horizontal',
        'lucide:trash-2',
        'lucide:triangle-alert',
        'lucide:type'
      ],
      sizeLimitKb: 64
    }
  },
  ui: {
    colorMode: false,
    fonts: false
  }
})

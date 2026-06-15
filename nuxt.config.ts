// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxt/ui', '@nuxtjs/seo'],
  app: {
    head: {
      htmlAttrs: {
        lang: 'es'
      },
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Special+Elite&display=swap'
        }
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

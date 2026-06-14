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
  ui: {
    colorMode: false,
    fonts: false
  }
})

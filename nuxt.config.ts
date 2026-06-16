// https://nuxt.com/docs/api/configuration/nuxt-config
const posthogPublicKey = process.env.NUXT_PUBLIC_POSTHOG_KEY ?? 'phc_DcGSF2PLvD4w6d3SVUqu8VokXReq3FTZcH6vnsZMzGmC'
const posthogHost = process.env.NUXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'
const posthogPersonalApiKey = process.env.POSTHOG_PERSONAL_API_KEY
const posthogReleaseVersion = process.env.CF_PAGES_COMMIT_SHA ?? process.env.GITHUB_SHA

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxt/ui', '@nuxtjs/seo', '@posthog/nuxt'],
  posthogConfig: {
    publicKey: posthogPublicKey,
    host: posthogHost,
    debug: process.env.NUXT_PUBLIC_POSTHOG_DEBUG === 'true',
    clientConfig: {
      autocapture: true,
      capture_exceptions: true,
      capture_pageleave: 'if_capture_pageview',
      capture_pageview: 'history_change',
      disable_session_recording: true,
      person_profiles: 'identified_only'
    },
    serverConfig: {
      enableExceptionAutocapture: true
    },
    sourcemaps: posthogPersonalApiKey
      ? {
          enabled: true,
          projectId: '473281',
          personalApiKey: posthogPersonalApiKey,
          releaseName: 'fanzines',
          ...(posthogReleaseVersion ? { releaseVersion: posthogReleaseVersion } : {})
        }
      : undefined
  },
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

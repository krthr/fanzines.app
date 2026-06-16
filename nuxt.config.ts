// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/ui",
    "@nuxtjs/seo",
    "@nuxt/image",
    "@nuxt/fonts",
    "@nuxt/scripts",
  ],
  runtimeConfig: {
    public: {
      scripts: {
        posthog: {
          apiKey: process.env.NUXT_PUBLIC_SCRIPTS_POSTHOG_API_KEY || "",
        },
      },
    },
  },
  app: {
    head: {
      htmlAttrs: {
        lang: "es",
      },
      link: [
        {
          rel: "icon",
          type: "image/x-icon",
          sizes: "any",
          href: "/favicon.ico",
        },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      ],
    },
  },
  css: ["~/assets/css/main.css"],
  site: {
    url: "https://fanzines.app",
    name: "Fanzines",
    description:
      "Editor en el navegador para crear, imprimir y exportar fanzines A4 plegables.",
    defaultLocale: "es",
  },
  sitemap: {
    urls: ["/", "/editor"],
  },
  robots: {
    sitemap: ["https://fanzines.app/sitemap.xml"],
  },
  image: {
    provider: "ipxStatic",
    format: ["webp"],
    screens: {
      xs: 320,
      sm: 500,
      md: 760,
      lg: 1040,
      xl: 1240,
    },
  },
  fonts: {
    families: [
      { name: "Outfit", weights: [400, 600, 700, 800, 900] },
      { name: "Special Elite", weights: [400] },
    ],
  },
  ogImage: {
    enabled: false,
  },
  routeRules: {
    "/": { prerender: true },
    "/editor": { prerender: true, robots: true },
  },
  scripts: {
    registry: {
      posthog: {
        trigger: "onNuxtReady",
        autocapture: false,
        capturePageview: "history_change",
        disableSessionRecording: true,
        config: {
          defaults: "2026-01-30",
          capture_exceptions: {
            capture_unhandled_errors: true,
            capture_unhandled_rejections: true,
            capture_console_errors: false,
          },
        },
      },
    },
  },
  vite: {
    optimizeDeps: {
      include: [
        "vue-konva",
        "vue-konva/core",
        "jspdf",
        "konva",
        "konva/lib/Group",
        "konva/lib/Layer",
        "konva/lib/Stage",
        "konva/lib/shapes/Image",
        "konva/lib/shapes/Rect",
        "konva/lib/shapes/Text",
        "konva/lib/shapes/Transformer",
        "gsap",
        "gsap/ScrollTrigger",
        "@unhead/schema-org/vue",
      ],
    },
  },
  icon: {
    serverBundle: {
      collections: ["lucide"],
    },
    clientBundle: {
      scan: false,
      icons: [
        "lucide:align-center",
        "lucide:align-horizontal-justify-center",
        "lucide:align-horizontal-justify-end",
        "lucide:align-horizontal-justify-start",
        "lucide:align-left",
        "lucide:align-right",
        "lucide:align-vertical-justify-center",
        "lucide:align-vertical-justify-end",
        "lucide:align-vertical-justify-start",
        "lucide:bring-to-front",
        "lucide:download",
        "lucide:expand",
        "lucide:image-plus",
        "lucide:info",
        "lucide:maximize",
        "lucide:refresh-cw",
        "lucide:scissors",
        "lucide:send-to-back",
        "lucide:sliders-horizontal",
        "lucide:trash-2",
        "lucide:triangle-alert",
        "lucide:type",
      ],
      sizeLimitKb: 64,
    },
  },
  ui: {
    colorMode: false,
    fonts: false,
  },
});

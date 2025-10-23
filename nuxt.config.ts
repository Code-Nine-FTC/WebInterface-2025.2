// https://nuxt.com/docs/api/configuration/nuxt-config
import { pt } from 'vuetify/locale';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/scss/main.scss'],

  app: {
    head: {
      title: 'WebInterface 2025.2',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },

  runtimeConfig: {
    public: {
      // Support both API_BASE and NUXT_PUBLIC_API_BASE envs (and provide uppercase alias)
      apiBase: process.env.API_BASE || process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080',
      API_BASE: process.env.API_BASE || process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080',
    },
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/scss/_variables.scss" as *;\n@use "@/assets/scss/_mixins.scss" as *;`,
        },
      },
    },
  },

  // Modules
  modules: ['vuetify-nuxt-module', '@pinia/nuxt', '@nuxtjs/tailwindcss'],

  vuetify: {
    moduleOptions: {
      /* module specific options */
    },
    vuetifyOptions: {
      locale: {
        locale: 'pt',
        messages: { pt },
      },
    },
  },

  // Build Configuration
  build: {
    transpile: ['vuetify'],
  },
});

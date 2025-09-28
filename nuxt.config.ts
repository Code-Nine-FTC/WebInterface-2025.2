// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  css: ["~/assets/scss/main.scss"],

  // Configuração do App
  app: {
    head: {
      title: "WebInterface 2025.2",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE,
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
  modules: ["vuetify-nuxt-module", "@pinia/nuxt", "@nuxtjs/tailwindcss"],

  // Build Configuration
  build: {
    transpile: ["vuetify"],
  },
});

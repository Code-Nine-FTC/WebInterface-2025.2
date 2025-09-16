// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  // CSS Global
  css: [
    '~/assets/css/global.css'
  ],
  
  // Configuração do App
  app: {
    head: {
      title: 'WebInterface 2025.2',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  
  // Configuração de Layouts
  dir: {
    layouts: 'layouts'
  },
  
  // Modules
  modules: [
    'vuetify-nuxt-module'
  ],
  
  // Build Configuration
  build: {
    transpile: ['vuetify']
  }
})

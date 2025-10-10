// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/image', '@nuxt/ui', '@vueuse/nuxt'],

  ssr: false,
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    databaseUrl: 'postgresql://postgres@localhost:5432/postgres',
    minioEndpoint: 'https://minio-s3.pucwoll.dev',
    minioAccessKey: '',
    minioSecretKey: '',
    minioBucket: 'vyberko',
  },
  compatibilityDate: '2025-07-15',
  eslint: {
    config: {
      stylistic: true,
    },
  },
})

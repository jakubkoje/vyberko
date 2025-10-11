// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/image', '@nuxt/ui', '@vueuse/nuxt', 'nuxt-auth-utils'],

  ssr: false,
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    databaseUrl: 'postgresql://postgres@localhost:5432/postgres',
    minioEndpoint: 'https://minio-s3.pucwoll.dev',
    minioAccessKey: '',
    minioSecretKey: '',
    minioBucket: 'vyberko',
    oauth: {
      keycloak: {
        clientId: process.env.NUXT_OAUTH_KEYCLOAK_CLIENT_ID || '',
        clientSecret: process.env.NUXT_OAUTH_KEYCLOAK_CLIENT_SECRET || '',
        adminClientId: process.env.NUXT_OAUTH_KEYCLOAK_ADMIN_CLIENT_ID || '',
        adminClientSecret: process.env.NUXT_OAUTH_KEYCLOAK_ADMIN_CLIENT_SECRET || '',
        serverUrl: process.env.NUXT_OAUTH_KEYCLOAK_SERVER_URL || '',
        realm: process.env.NUXT_OAUTH_KEYCLOAK_REALM || '',
        redirectURL: process.env.NUXT_OAUTH_KEYCLOAK_REDIRECT_URL || '',
      },
    },
    public: {
      oauth: {
        keycloak: {
          serverUrl: process.env.NUXT_OAUTH_KEYCLOAK_SERVER_URL || '',
          realm: process.env.NUXT_OAUTH_KEYCLOAK_REALM || '',
        },
      },
    },
  },
  compatibilityDate: '2025-07-15',
  nitro: {
    experimental: {
      tasks: true,
    },
  },
  eslint: {
    config: {
      stylistic: true,
    },
  },
})

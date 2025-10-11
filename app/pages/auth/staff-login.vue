<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const route = useRoute()
const error = computed(() => route.query.error as string | undefined)

// Function to login with Keycloak
function loginWithKeycloak() {
  navigateTo('/api/auth/keycloak', { external: true })
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">
            Prihlásenie zamestnancov
          </h1>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Zamestnanci (Admin, Veční gestori, Členovia komisie) sa prihlasujú cez Keycloak s 2FA.
        </p>

        <UAlert
          v-if="error"
          color="red"
          variant="soft"
          title="Prihlásenie zlyhalo"
          description="Nastala chyba pri prihlasovaní cez Keycloak. Skúste to prosím znova."
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'red', variant: 'link' }"
        />

        <UButton
          block
          size="lg"
          icon="i-heroicons-key"
          @click="loginWithKeycloak"
        >
          Prihlásiť sa cez Keycloak
        </UButton>

        <UDivider label="ALEBO" />

        <div class="text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Ste uchádzač?
          </p>
          <UButton
            variant="link"
            to="/auth/candidate-login"
          >
            Prihlásenie uchádzačov →
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>

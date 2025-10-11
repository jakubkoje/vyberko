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
            Staff Login
          </h1>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Staff members (Admin, Subject Experts, Commission Members) login through Keycloak with 2FA.
        </p>

        <UAlert
          v-if="error"
          color="red"
          variant="soft"
          title="Authentication Failed"
          description="There was an error logging in with Keycloak. Please try again."
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'red', variant: 'link' }"
        />

        <UButton
          block
          size="lg"
          icon="i-heroicons-key"
          @click="loginWithKeycloak"
        >
          Login with Keycloak
        </UButton>

        <UDivider label="OR" />

        <div class="text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Are you a candidate?
          </p>
          <UButton
            variant="link"
            to="/auth/candidate-login"
          >
            Candidate Login →
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>

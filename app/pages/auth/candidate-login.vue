<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const cisIdentifier = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function handleLogin() {
  error.value = null
  loading.value = true

  try {
    const response = await $fetch('/api/auth/local', {
      method: 'POST',
      body: {
        cisIdentifier: cisIdentifier.value,
        password: password.value,
      },
    })

    if (response.success && response.redirectTo) {
      await navigateTo(response.redirectTo)
    }
  }
  catch (err: any) {
    error.value = err.data?.message || 'Neplatné prihlasovacie údaje. Skúste to prosím znova.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">
            Prihlásenie uchádzača
          </h1>
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="handleLogin">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Zadajte váš identifikátor a dočasné heslo poskytnuté administrátorom.
        </p>

        <UAlert
          v-if="error"
          color="red"
          variant="soft"
          :title="error"
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'red', variant: 'link' }"
          @close="error = null"
        />

        <UFormGroup label="Identifikátor" name="cisIdentifier" required>
          <UInput
            v-model="cisIdentifier"
            placeholder="UC-2025-0001"
            size="lg"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup label="Heslo" name="password" required>
          <UInput
            v-model="password"
            type="password"
            placeholder="Zadajte vaše dočasné heslo"
            size="lg"
            :disabled="loading"
          />
        </UFormGroup>

        <UButton
          type="submit"
          block
          size="lg"
          :loading="loading"
          :disabled="!cisIdentifier || !password"
        >
          Prihlásiť sa
        </UButton>

        <UDivider label="ALEBO" />

        <div class="text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Ste zamestnanec?
          </p>
          <UButton
            variant="link"
            to="/auth/staff-login"
          >
            Prihlásenie zamestnancov →
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>

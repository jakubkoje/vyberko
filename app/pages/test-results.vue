<template>
  <div class="min-h-screen bg-background flex items-center justify-center">
    <div class="container mx-auto py-8 max-w-2xl">
      <UCard>
        <div class="text-center py-16">
          <h1 class="text-3xl font-bold mb-8 text-muted">
            Výsledok
          </h1>
          
          <div class="mb-12">
            <UBadge
              size="xl"
              :class="[
                'inline-block px-12 py-8 rounded-2xl text-white text-4xl font-bold',
                isPassed ? 'bg-green-500' : 'bg-red-500'
              ]"
            >
              {{ isPassed ? 'ÚSPEŠNÝ TEST' : 'NEÚSPEŠNÝ TEST' }}
            </UBadge>
          </div>

          <UDivider class="my-8" />

          <div class="space-y-6 text-left max-w-md mx-auto">
            <UAlert
              :color="isPassed ? 'green' : 'red'"
              variant="soft"
              :title="isPassed ? 'Test úspešne absolvovaný!' : 'Test neúspešný'"
              :description="isPassed
                ? 'Gratulujeme! Dosiahli ste potrebný počet bodov. Môžete pokračovať na ústnu časť výberového konania.'
                : 'Nedosiahli ste požadovaný počet bodov. Žiaľ, nemôžete pokračovať v ďalších kolách výberového konania.'"
              :icon="isPassed ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
            />

            <div>
              <h2 class="text-xl font-semibold mb-3">
                Ďalší krok
              </h2>
              <div v-if="isPassed" class="space-y-3 text-muted">
                <div class="flex items-start gap-3">
                  <UIcon
                    name="i-lucide-clipboard-list"
                    class="text-primary mt-1 flex-shrink-0"
                  />
                  <span>
                    <strong class="text-foreground">Ústna skúška:</strong>
                    Prosím, ozvite sa administrátorovi výberového konania. Budete pozvaný na ústnu časť testovania, kde vás bude hodnotiť komisia.
                  </span>
                </div>
              </div>
              <div v-else class="space-y-3 text-muted">
                <div class="flex items-start gap-3">
                  <UIcon
                    name="i-lucide-info"
                    class="text-primary mt-1 flex-shrink-0"
                  />
                  <span>
                    <strong class="text-foreground">Ukončenie:</strong>
                    Vaše výsledky boli zaznamenané. Výberové konanie pre vás týmto končí. Ďakujeme za účasť.
                  </span>
                </div>
              </div>
            </div>

            <div class="pt-4">
              <UButton
                to="/"
                color="primary"
                size="lg"
                block
              >
                <template #leading>
                  <UIcon name="i-lucide-home" />
                </template>
                Zavrieť
              </UButton>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const code = ref(route.query.code as string || '')
const results = ref<any>(null)

const isPassed = computed(() => {
  if (!results.value) return false
  // Check overall passed status
  if (results.value.overall) {
    return results.value.overall.passed === true
  }
  // Fallback
  return false
})

// Load results from localStorage (only need pass/fail status)
onMounted(() => {
  if (process.client && code.value) {
    const stored = localStorage.getItem(`test-results-${code.value}`)
    if (stored) {
      try {
        results.value = JSON.parse(stored)
        // Clear the detailed results from localStorage after loading
        // Keep only the pass/fail status
        localStorage.removeItem(`test-results-${code.value}`)
      } catch (e) {
        console.error('Failed to parse results:', e)
      }
    }
  }
})

useSeoMeta({
  title: 'Výsledky testu - Digitálny výberový test',
  description: 'Výsledky digitálneho výberového testu.'
})

console.log(results.value, isPassed.value)
</script>


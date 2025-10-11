<template>
  <div class="min-h-screen bg-background flex items-center justify-center">
    <div class="container mx-auto py-8 max-w-2xl">
      <UCard>
        <div class="text-center py-16">
          <h1 class="text-3xl font-bold mb-8 text-muted">
            Výsledok
          </h1>
          
          <div class="mb-12">
            <!-- <UBadge
              :class="[
                'inline-block px-12 py-8 rounded-2xl text-white text-4xl font-bold',
                isPassed ? 'bg-green-500' : 'bg-red-500'
              ]"
            >
              {{ isPassed ? 'ÚSPEŠNÝ TEST' : 'NEÚSPEŠNÝ TEST' }}
            </UBadge> -->

            <UBadge size="xl" :class="[
                'inline-block px-12 py-8 rounded-2xl text-white text-4xl font-bold',
                isPassed ? 'bg-green-500' : 'bg-red-500'
              ]">{{ isPassed ? 'ÚSPEŠNÝ TEST' : 'NEÚSPEŠNÝ TEST' }}</UBadge>

          </div>

          <UDivider class="my-8" />

          <div class="space-y-6 text-left max-w-md mx-auto">
            <UAlert
              :color="isPassed ? 'green' : 'blue'"
              variant="soft"
              :title="isPassed ? 'Gratulujeme!' : 'Ďakujeme za účasť'"
              :description="isPassed 
                ? 'Úspešne ste absolvovali výberový test. Vaše výsledky boli odoslané a uložené.'
                : 'Test ste dokončili. Vaše výsledky boli odoslané a uložené.'"
              :icon="isPassed ? 'i-lucide-check-circle' : 'i-lucide-info'"
            />

            <div>
              <h2 class="text-xl font-semibold mb-3">
                Čo sa stane ďalej?
              </h2>
              <ul class="space-y-3 text-muted">
                <li class="flex items-start gap-3">
                  <UIcon
                    name="i-lucide-mail"
                    class="text-primary mt-1 flex-shrink-0"
                  />
                  <span>
                    <strong class="text-foreground">Email s potvrdením:</strong> 
                    Do 24 hodín dostanete email s potvrdením o prijatí vašich výsledkov.
                  </span>
                </li>
                <li class="flex items-start gap-3">
                  <UIcon
                    name="i-lucide-chart-bar"
                    class="text-primary mt-1 flex-shrink-0"
                  />
                  <span>
                    <strong class="text-foreground">Vyhodnotenie:</strong> 
                    Vaše výsledky budú kompletne vyhodnotené v priebehu 5 pracovných dní.
                  </span>
                </li>
                <li class="flex items-start gap-3">
                  <UIcon
                    name="i-lucide-phone"
                    class="text-primary mt-1 flex-shrink-0"
                  />
                  <span>
                    <strong class="text-foreground">Kontakt:</strong> 
                    V prípade úspešného absolvovania vás budeme kontaktovať s informáciami o ďalších krokoch výberového konania.
                  </span>
                </li>
              </ul>
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
                Späť na hlavnú stránku
              </UButton>
            </div>
          </div>
        </div>
      </UCard>

      <div class="mt-6 text-center text-sm text-muted">
        <p>
          Máte otázky? Kontaktujte nás na 
          <a
            href="mailto:podpora@vyberko.sk"
            class="text-primary hover:underline"
          >
            podpora@vyberko.sk
          </a>
        </p>
      </div>
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


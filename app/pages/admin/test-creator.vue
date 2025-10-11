<template>
  <div class="min-h-screen bg-background">
    <div class="container mx-auto py-8">
      <div class="mb-6">
        <h1 class="text-3xl font-bold">
          Tvorba výberového testu
        </h1>
        <p class="text-muted mt-2">
          Vytvorte a upravte konfiguráciu digitálneho výberového testu
        </p>
      </div>

      <div class="mb-6">
        <UTabs
          v-model="activeTab"
          :items="tabs"
        />
      </div>

      <ClientOnly>
        <!-- Designer Tab -->
        <div v-show="activeTab === 0">
          <UCard>
            <SurveyCreator
              :json="surveyJson"
              @change="handleCreatorChange"
              @save="handleCreatorSave"
            />
          </UCard>
        </div>

        <!-- Custom Preview Tab -->
        <div v-show="activeTab === 1">
          <SurveyCustomPreview
            v-if="surveyJson"
            :survey-data="surveyJson"
            @complete="handlePreviewComplete"
          />
        </div>

        <!-- JSON Editor Tab -->
        <div v-show="activeTab === 2">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">
                  JSON Konfigurácia
                </h3>
                <div class="flex gap-2">
                  <UButton
                    variant="outline"
                    size="sm"
                    @click="copyJson"
                  >
                    <template #leading>
                      <UIcon name="i-lucide-copy" />
                    </template>
                    Kopírovať
                  </UButton>
                  <UButton
                    color="primary"
                    size="sm"
                    @click="saveConfiguration"
                  >
                    <template #leading>
                      <UIcon name="i-lucide-save" />
                    </template>
                    Uložiť
                  </UButton>
                </div>
              </div>
            </template>

            <UTextarea
              v-model="jsonString"
              :rows="30"
              placeholder="JSON konfigurácia testu..."
              class="font-mono text-sm"
            />
          </UCard>
        </div>
      </ClientOnly>

      <!-- Save Notification -->
      <UNotifications />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const activeTab = ref(0)
const surveyJson = ref<any>(null)
const jsonString = ref('')
const toast = useToast()

const tabs = [
  {
    label: 'Designer',
    icon: 'i-lucide-layout-dashboard'
  },
  {
    label: 'Náhľad (NuxtUI)',
    icon: 'i-lucide-eye'
  },
  {
    label: 'JSON Editor',
    icon: 'i-lucide-code'
  }
]

// Default survey configuration
const defaultSurveyJson = {
  title: "Test písania na klávesnici",
  description: "Tento test hodnotí vašu rýchlosť a presnosť písania na klávesnici.",
  showProgressBar: "top",
  progressBarType: "buttons",
  showQuestionNumbers: "off",
  pages: [
    {
      name: "instructions",
      title: "Inštrukcie",
      elements: [
        {
          type: "html",
          name: "intro",
          html: "<h3>Vitajte v teste</h3><p>Prečítajte si inštrukcie pred začatím testu.</p>"
        }
      ]
    }
  ]
}

const handleCreatorChange = (json: any) => {
  surveyJson.value = json
  jsonString.value = JSON.stringify(json, null, 2)
}

const handleCreatorSave = (json: any) => {
  surveyJson.value = json
  jsonString.value = JSON.stringify(json, null, 2)
  toast.add({
    title: 'Auto-uložené',
    description: 'Zmeny boli automaticky uložené',
    color: 'green',
    timeout: 2000
  })
}

const handlePreviewComplete = (results: any) => {
  console.log('Preview results:', results)
  toast.add({
    title: 'Náhľad dokončený',
    description: 'Výsledky náhľadu boli vypísané do konzoly',
    color: 'green'
  })
}

const copyJson = () => {
  navigator.clipboard.writeText(jsonString.value)
  toast.add({
    title: 'Skopírované',
    description: 'JSON konfigurácia bola skopírovaná do schránky',
    color: 'green'
  })
}

const saveConfiguration = async () => {
  try {
    // Validate JSON
    JSON.parse(jsonString.value)
    
    // TODO: Save to backend
    // await $fetch('/api/test/configuration', {
    //   method: 'POST',
    //   body: { configuration: jsonString.value }
    // })
    
    toast.add({
      title: 'Uložené',
      description: 'Konfigurácia testu bola úspešne uložená',
      color: 'green'
    })
  } catch (error) {
    toast.add({
      title: 'Chyba',
      description: 'Neplatný JSON formát',
      color: 'red'
    })
  }
}

// Initialize with default configuration
onMounted(() => {
  surveyJson.value = defaultSurveyJson
  jsonString.value = JSON.stringify(defaultSurveyJson, null, 2)
})

// Watch for JSON string changes to update preview
watch(jsonString, (newValue) => {
  try {
    const parsed = JSON.parse(newValue)
    surveyJson.value = parsed
  } catch (e) {
    // Invalid JSON, don't update
  }
})
</script>


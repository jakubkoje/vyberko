<script setup lang="ts">
const toast = useToast()

// Organization GUID for MIRRI (from the URL example)
const organizationGuid = ref('f23318db-117e-442e-82ee-bfad1eba5f5c')

const { data: cisssData, pending, refresh } = await useFetch('/api/procedures/cisss-list', {
  query: { organizationGuid },
})

const isImporting = ref<Record<string, boolean>>({})

const emit = defineEmits<{
  close: [{ imported: boolean, count: number }]
}>()

const importedCount = ref(0)

async function importProcedure(procedure: any) {
  isImporting.value[procedure.guid] = true

  try {
    // First, parse the procedure detail page
    const parsed = await $fetch('/api/procedures/parse-cisss', {
      method: 'POST',
      body: { url: procedure.url },
    })

    console.log('Parsed data from CISSS:', {
      identifier: parsed.identifier,
      testTypes: parsed.testTypes,
      personalCharacteristics: parsed.personalCharacteristics,
      url: procedure.url,
    })

    // Create procedure with parsed data
    await $fetch('/api/procedures', {
      method: 'POST',
      body: {
        ...parsed,
        status: 'draft',
      },
    })

    const warnings: string[] = []
    if (!parsed.testTypes || parsed.testTypes.length === 0) {
      warnings.push('žiadne písomné testy')
    }
    if (!parsed.personalCharacteristics || parsed.personalCharacteristics.length === 0) {
      warnings.push('žiadne kritériá ústnej skúšky')
    }

    toast.add({
      title: 'Importované',
      description: warnings.length > 0
        ? `${procedure.identifier} - Upozornenie: ${warnings.join(', ')}`
        : `${procedure.identifier} importované úspešne`,
      color: warnings.length > 0 ? 'orange' : 'green',
      timeout: 5000,
    })

    importedCount.value++

    // Refresh the list
    await refresh()
  }
  catch (error: any) {
    console.error('Import error:', error)
    toast.add({
      title: 'Import zlyhal',
      description: error.data?.message || 'Nepodarilo sa importovať výberové konanie',
      color: 'red',
    })
  }
  finally {
    isImporting.value[procedure.guid] = false
  }
}

async function viewInCisss(url: string) {
  window.open(url, '_blank')
}

function closeModal() {
  emit('close', { imported: importedCount.value > 0, count: importedCount.value })
}

const statusColors: Record<string, string> = {
  'Vyhlásený výsledok': 'success',
  'Prihlasovanie': 'primary',
  'Zrušené': 'error',
  'Ukončené': 'neutral',
}

const getStatusColor = (status: string) => {
  return statusColors[status] || 'neutral'
}
</script>

<template>
  <UModal
    fullscreen
    :close="{ onClick: closeModal }"
    :ui="{
      base: 'overflow-hidden',
      body: 'flex-1 overflow-y-auto',
      footer: 'justify-end',
    }"
  >
    <template #header>
      <div class="flex items-center justify-between flex-1">
        <div>
          <h2 class="text-2xl font-bold">
            Import z CISŠS
          </h2>
          <p class="text-sm text-muted mt-1">
            Skontrolujte a importujte výberové konania z CISŠS, ktoré ešte nie sú v systéme
          </p>
        </div>
        <UButton
          icon="i-lucide-refresh-cw"
          label="Obnoviť"
          variant="outline"
          :loading="pending"
          @click="refresh"
        />
      </div>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Stats -->
        <div v-if="cisssData" class="grid grid-cols-3 gap-4">
          <div class="p-4 bg-elevated rounded-lg border border-border">
            <div class="text-2xl font-bold text-highlighted">
              {{ cisssData.total }}
            </div>
            <div class="text-sm text-muted">
              Celkom v CISŠS
            </div>
          </div>
          <div class="p-4 bg-elevated rounded-lg border border-border">
            <div class="text-2xl font-bold text-success">
              {{ cisssData.existing }}
            </div>
            <div class="text-sm text-muted">
              Už v systéme
            </div>
          </div>
          <div class="p-4 bg-elevated rounded-lg border border-border">
            <div class="text-2xl font-bold text-warning">
              {{ cisssData.missing }}
            </div>
            <div class="text-sm text-muted">
              Chýbajúce (možno importovať)
            </div>
          </div>
        </div>

        <!-- Missing Procedures List -->
        <div v-if="cisssData?.missingProcedures && cisssData.missingProcedures.length > 0" class="space-y-4">
          <h3 class="text-xl font-semibold">
            Chýbajúce výberové konania ({{ cisssData.missing }})
          </h3>

          <div class="space-y-4">
            <div
              v-for="procedure in cisssData.missingProcedures"
              :key="procedure.guid"
              class="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-2">
                    <code class="text-sm font-mono font-semibold text-primary">
                      {{ procedure.identifier }}
                    </code>
                    <UBadge
                      :label="procedure.status"
                      :color="getStatusColor(procedure.status)"
                      variant="subtle"
                      size="xs"
                    />
                  </div>

                  <h3 class="text-lg font-medium text-highlighted mb-2">
                    {{ procedure.title }}
                  </h3>

                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span class="text-muted">Typ:</span>
                      <span class="ml-2 text-highlighted">{{ procedure.type || 'N/A' }}</span>
                    </div>
                    <div>
                      <span class="text-muted">Zverejnené:</span>
                      <span class="ml-2 text-highlighted">{{ procedure.publicationDate || 'N/A' }}</span>
                    </div>
                    <div class="col-span-2">
                      <span class="text-muted">Útvar:</span>
                      <span class="ml-2 text-highlighted">{{ procedure.organizationalUnit || 'N/A' }}</span>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col gap-2">
                  <UButton
                    icon="i-lucide-download"
                    label="Importovať"
                    color="primary"
                    :loading="isImporting[procedure.guid]"
                    @click="importProcedure(procedure)"
                  />
                  <UButton
                    icon="i-lucide-external-link"
                    label="Otvoriť v CISŠS"
                    variant="outline"
                    size="xs"
                    @click="viewInCisss(procedure.url)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No Missing Procedures -->
        <div v-else-if="!pending && cisssData" class="flex flex-col items-center justify-center py-12">
          <UIcon
            name="i-lucide-check-circle"
            class="size-12 text-success mb-4"
          />
          <p class="text-lg font-medium text-highlighted mb-2">
            Všetky výberové konania sú aktuálne
          </p>
          <p class="text-sm text-muted">
            Všetky výberové konania z CISŠS sú už v systéme
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="pending" class="flex flex-col items-center justify-center py-12">
          <UIcon
            name="i-lucide-loader-2"
            class="size-12 text-primary animate-spin mb-4"
          />
          <p class="text-muted">
            Načítavam výberové konania z CISŠS...
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton
        label="Zavrieť"
        color="neutral"
        variant="ghost"
        @click="closeModal"
      />
    </template>
  </UModal>
</template>

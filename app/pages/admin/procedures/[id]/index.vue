<script setup lang="ts">
const route = useRoute()
const procedureId = computed(() => Number(route.params.id))

const { data: procedure } = await useFetch(`/api/procedures/${procedureId.value}`)

const statusColors: Record<string, string> = {
  active: 'success',
  closed: 'error',
  draft: 'warning',
  testing: 'primary',
  evaluating: 'warning',
  completed: 'success',
  cancelled: 'error',
}

const statusLabels: Record<string, string> = {
  draft: 'Koncept',
  active: 'Aktívne',
  testing: 'Testovanie',
  evaluating: 'Hodnotenie',
  completed: 'Dokončené',
  cancelled: 'Zrušené',
}

const formatDate = (date: string) => {
  if (!date) return 'Nezadané'
  return new Date(date).toLocaleDateString('sk-SK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div>
    <UPageCard
      title="Prehľad výberového konania"
      description="Detaily a informácie o tomto výberovom konaní."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    />

    <!-- Procedure Header -->
    <UPageCard
      variant="subtle"
      title="Hlavička výberového konania"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-muted">Identifikátor</label>
            <p class="mt-1 text-base text-highlighted font-mono">
              {{ procedure?.identifier || 'N/A' }}
            </p>
          </div>

          <div>
            <label class="text-sm font-medium text-muted">Stav</label>
            <div class="mt-1">
              <UBadge
                :label="statusLabels[procedure?.status || 'draft'] || procedure?.status"
                :color="statusColors[procedure?.status || 'draft']"
                variant="subtle"
              />
            </div>
          </div>
        </div>

        <div>
          <label class="text-sm font-medium text-muted">Názov</label>
          <p class="mt-1 text-base text-highlighted">
            {{ procedure?.title || 'Bez názvu' }}
          </p>
        </div>

        <div v-if="procedure?.description">
          <label class="text-sm font-medium text-muted">Popis</label>
          <p class="mt-1 text-base text-highlighted whitespace-pre-wrap">
            {{ procedure.description }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-default">
          <div>
            <label class="text-sm font-medium text-muted">Druh výberového konania</label>
            <p class="mt-1 text-base text-highlighted">
              {{ procedure?.procedureType || 'Nezadané' }}
            </p>
          </div>

          <div>
            <label class="text-sm font-medium text-muted">Druh štátnej služby</label>
            <p class="mt-1 text-base text-highlighted">
              {{ procedure?.serviceType || 'Nezadané' }}
            </p>
          </div>

          <div>
            <label class="text-sm font-medium text-muted">Odbor štátnej služby</label>
            <p class="mt-1 text-base text-highlighted">
              {{ procedure?.civilServiceSector || 'Nezadané' }}
            </p>
          </div>

          <div>
            <label class="text-sm font-medium text-muted">Zaradenie v organizačnej štruktúre</label>
            <p class="mt-1 text-base text-highlighted">
              {{ procedure?.organizationalUnit || 'Nezadané' }}
            </p>
          </div>

          <div>
            <label class="text-sm font-medium text-muted">Obsadzovaná funkcia</label>
            <p class="mt-1 text-base text-highlighted">
              {{ procedure?.positionTitle || 'Nezadané' }}
            </p>
          </div>

          <div>
            <label class="text-sm font-medium text-muted">Počet obsadzovaných miest</label>
            <p class="mt-1 text-base text-highlighted">
              {{ procedure?.numberOfPositions || 1 }}
            </p>
          </div>

          <div>
            <label class="text-sm font-medium text-muted">Dátum konania</label>
            <p class="mt-1 text-base text-highlighted">
              {{ procedure?.procedureDate ? formatDate(procedure.procedureDate) : 'Nezadané' }}
            </p>
          </div>
        </div>

        <!-- Metadata -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-default">
          <div>
            <label class="text-sm font-medium text-muted">Vytvorené</label>
            <p class="mt-1 text-base text-highlighted">
              {{ procedure?.createdAt ? formatDate(procedure.createdAt) : 'Neznáme' }}
            </p>
          </div>

          <div>
            <label class="text-sm font-medium text-muted">Posledná aktualizácia</label>
            <p class="mt-1 text-base text-highlighted">
              {{ procedure?.updatedAt ? formatDate(procedure.updatedAt) : 'Neznáme' }}
            </p>
          </div>
        </div>
      </div>
    </UPageCard>
  </div>
</template>

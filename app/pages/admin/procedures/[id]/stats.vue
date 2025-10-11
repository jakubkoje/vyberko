<script setup lang="ts">
const route = useRoute()
const procedureId = computed(() => Number(route.params.id))

const { data: stats, refresh } = await useFetch(`/api/procedures/${procedureId.value}/stats`, {
  default: () => ({
    procedure: {},
    contenders: { total: 0, byStatus: [] },
    tests: { total: 0, byCategory: [] },
    staff: { total: 0, active: 0, pending: 0 },
    evaluation: { criteriaCount: 0 },
    testResults: { total: 0, completed: 0, avgScore: 0, passRate: 0, byCategory: [] },
  }),
})

const { data: examCategoriesCodelist } = await useFetch('/api/exam-categories/codelist', {
  default: () => [],
})

function getCategoryLabel(value: string): string {
  const item = examCategoriesCodelist.value.find((c: any) => c.value === value)
  return item?.label || value
}

const statusLabels: Record<string, string> = {
  registered: 'Registrovaný',
  testing: 'Testovanie',
  passed_written: 'Prešiel písomnou skúškou',
  failed_written: 'Neprešiel písomnou skúškou',
  evaluating: 'Hodnotenie',
  passed: 'Úspešný',
  failed: 'Neúspešný',
  selected: 'Vybraný',
}

const statusColors: Record<string, string> = {
  registered: 'neutral',
  testing: 'primary',
  passed_written: 'success',
  failed_written: 'error',
  evaluating: 'warning',
  passed: 'success',
  failed: 'error',
  selected: 'success',
}

// Auto-refresh every 30 seconds
const refreshInterval = setInterval(refresh, 30000)

onUnmounted(() => {
  clearInterval(refreshInterval)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <UPageCard
      title="Dashboard štatistík"
      description="Real-time štatistiky a metriky pre toto výberové konanie."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="refresh"
      >
        Obnoviť
      </UButton>
    </UPageCard>

    <!-- Key Metrics Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <!-- Total Contenders -->
      <UPageCard variant="subtle">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-lg bg-primary/10">
            <UIcon
              name="i-lucide-users"
              class="size-6 text-primary"
            />
          </div>
          <div>
            <div class="text-2xl font-bold text-highlighted">
              {{ stats.contenders.total }}
            </div>
            <div class="text-sm text-muted">
              Celkom uchádzačov
            </div>
          </div>
        </div>
      </UPageCard>

      <!-- Total Tests -->
      <UPageCard variant="subtle">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-lg bg-primary/10">
            <UIcon
              name="i-lucide-file-edit"
              class="size-6 text-primary"
            />
          </div>
          <div>
            <div class="text-2xl font-bold text-highlighted">
              {{ stats.tests.total }}
            </div>
            <div class="text-sm text-muted">
              Celkom testov
            </div>
          </div>
        </div>
      </UPageCard>

      <!-- Active Staff -->
      <UPageCard variant="subtle">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-lg bg-success/10">
            <UIcon
              name="i-lucide-user-check"
              class="size-6 text-success"
            />
          </div>
          <div>
            <div class="text-2xl font-bold text-highlighted">
              {{ stats.staff.active }} / {{ stats.staff.total }}
            </div>
            <div class="text-sm text-muted">
              Aktívni zamestnanci
            </div>
          </div>
        </div>
      </UPageCard>

      <!-- Evaluation Criteria -->
      <UPageCard variant="subtle">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-lg bg-warning/10">
            <UIcon
              name="i-lucide-clipboard-list"
              class="size-6 text-warning"
            />
          </div>
          <div>
            <div class="text-2xl font-bold text-highlighted">
              {{ stats.evaluation.criteriaCount }}
            </div>
            <div class="text-sm text-muted">
              Kritériá hodnotenia
            </div>
          </div>
        </div>
      </UPageCard>

      <!-- Completed Tests -->
      <UPageCard variant="subtle">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-lg bg-success/10">
            <UIcon
              name="i-lucide-check-circle"
              class="size-6 text-success"
            />
          </div>
          <div>
            <div class="text-2xl font-bold text-highlighted">
              {{ stats.testResults.completed }} / {{ stats.testResults.total }}
            </div>
            <div class="text-sm text-muted">
              Dokončené testy
            </div>
          </div>
        </div>
      </UPageCard>
    </div>

    <!-- Test Results Performance -->
    <div
      v-if="stats.testResults.completed > 0"
      class="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      <!-- Average Score -->
      <UPageCard variant="subtle">
        <div class="text-center">
          <div class="text-4xl font-bold text-highlighted mb-2">
            {{ stats.testResults.avgScore.toFixed(1) }}
          </div>
          <div class="text-sm text-muted">
            Priemerné skóre
          </div>
        </div>
      </UPageCard>

      <!-- Pass Rate -->
      <UPageCard variant="subtle">
        <div class="text-center">
          <div class="text-4xl font-bold mb-2"
            :class="stats.testResults.passRate >= 70 ? 'text-success' : stats.testResults.passRate >= 50 ? 'text-warning' : 'text-error'"
          >
            {{ stats.testResults.passRate.toFixed(1) }}%
          </div>
          <div class="text-sm text-muted">
            Úspešnosť
          </div>
        </div>
      </UPageCard>
    </div>

    <!-- Detailed Statistics -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Candidates by Status -->
      <UPageCard
        title="Uchádzači podľa stavu"
        description="Rozdelenie uchádzačov podľa jednotlivých fáz"
      >
        <div
          v-if="stats.contenders.byStatus && stats.contenders.byStatus.length > 0"
          class="space-y-3"
        >
          <div
            v-for="item in stats.contenders.byStatus"
            :key="item.status"
            class="flex items-center justify-between p-3 rounded-md border border-default"
          >
            <div class="flex items-center gap-3">
              <UBadge
                :label="statusLabels[item.status] || item.status"
                :color="statusColors[item.status] || 'neutral'"
                variant="subtle"
              />
            </div>
            <div class="text-lg font-semibold text-highlighted">
              {{ item.count }}
            </div>
          </div>
        </div>
        <div
          v-else
          class="text-center py-8 text-muted"
        >
          Zatiaľ žiadni uchádzači
        </div>
      </UPageCard>

      <!-- Tests by Category -->
      <UPageCard
        title="Testy podľa kategórie"
        description="Rozdelenie testov podľa kategórií skúšok"
      >
        <div
          v-if="stats.tests.byCategory && stats.tests.byCategory.length > 0"
          class="space-y-3"
        >
          <div
            v-for="item in stats.tests.byCategory"
            :key="item.category"
            class="flex items-center justify-between p-3 rounded-md border border-default"
          >
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-file-text"
                class="size-4 text-muted"
              />
              <span class="text-sm font-medium">{{ getCategoryLabel(item.category) }}</span>
            </div>
            <div class="text-lg font-semibold text-highlighted">
              {{ item.count }}
            </div>
          </div>
        </div>
        <div
          v-else
          class="text-center py-8 text-muted"
        >
          Zatiaľ žiadne priradené testy
        </div>
      </UPageCard>
    </div>

    <!-- Test Results by Category -->
    <UPageCard
      v-if="stats.testResults.byCategory && stats.testResults.byCategory.length > 0"
      title="Výsledky testov podľa kategórie"
      description="Štatistiky dokončených testov v jednotlivých kategóriách"
    >
      <div class="space-y-3">
        <div
          v-for="item in stats.testResults.byCategory"
          :key="item.category"
          class="p-4 rounded-md border border-default"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-file-check"
                class="size-5 text-primary"
              />
              <span class="text-sm font-semibold">{{ getCategoryLabel(item.category) }}</span>
            </div>
            <UBadge
              :label="`${item.totalResponses} odpovedí`"
              variant="subtle"
              color="neutral"
            />
          </div>
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-xs text-muted mb-1">Priemerné skóre</div>
              <div class="text-lg font-semibold text-highlighted">{{ item.avgScore.toFixed(1) }}</div>
            </div>
            <div>
              <div class="text-xs text-muted mb-1">Úspešných</div>
              <div class="text-lg font-semibold text-success">{{ item.passedCount }}</div>
            </div>
            <div>
              <div class="text-xs text-muted mb-1">Úspešnosť</div>
              <div
                class="text-lg font-semibold"
                :class="item.passRate >= 70 ? 'text-success' : item.passRate >= 50 ? 'text-warning' : 'text-error'"
              >
                {{ item.passRate.toFixed(1) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </UPageCard>

    <!-- Last Updated Info -->
    <div class="text-xs text-muted text-center">
      Štatistiky sa automaticky aktualizujú každých 30 sekúnd
    </div>
  </div>
</template>

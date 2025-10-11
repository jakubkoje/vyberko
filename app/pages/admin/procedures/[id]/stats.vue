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
  registered: 'Registered',
  testing: 'Testing',
  passed_written: 'Passed Written',
  failed_written: 'Failed Written',
  evaluating: 'Evaluating',
  passed: 'Passed',
  failed: 'Failed',
  selected: 'Selected',
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
      title="Statistics Dashboard"
      description="Real-time statistics and metrics for this recruitment procedure."
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
        Refresh
      </UButton>
    </UPageCard>

    <!-- Key Metrics Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              Total Candidates
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
              Total Tests
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
              Active Staff
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
              Evaluation Criteria
            </div>
          </div>
        </div>
      </UPageCard>
    </div>

    <!-- Detailed Statistics -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Candidates by Status -->
      <UPageCard
        title="Candidates by Status"
        description="Distribution of candidates across different stages"
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
          No candidates yet
        </div>
      </UPageCard>

      <!-- Tests by Category -->
      <UPageCard
        title="Tests by Category"
        description="Distribution of tests across exam categories"
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
          No tests assigned yet
        </div>
      </UPageCard>
    </div>

    <!-- Last Updated Info -->
    <div class="text-xs text-muted text-center">
      Statistics auto-refresh every 30 seconds
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const procedureId = computed(() => Number(route.params.id))

const { data: procedure } = await useFetch(`/api/procedures/${procedureId.value}`)

const statusColors: Record<string, string> = {
  active: 'success',
  closed: 'error',
  draft: 'warning',
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div>
    <UPageCard
      title="Procedure Overview"
      description="Details and information about this recruitment procedure."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    />

    <UPageCard variant="subtle">
      <div class="space-y-6">
        <!-- Title -->
        <div>
          <label class="text-sm font-medium text-muted">Title</label>
          <p class="mt-1 text-base text-highlighted">
            {{ procedure?.title || 'Untitled Procedure' }}
          </p>
        </div>

        <!-- Status -->
        <div>
          <label class="text-sm font-medium text-muted">Status</label>
          <div class="mt-1">
            <UBadge
              :label="procedure?.status || 'Unknown'"
              :color="statusColors[procedure?.status || 'draft']"
              variant="subtle"
              class="capitalize"
            />
          </div>
        </div>

        <!-- Description -->
        <div v-if="procedure?.description">
          <label class="text-sm font-medium text-muted">Description</label>
          <p class="mt-1 text-base text-highlighted whitespace-pre-wrap">
            {{ procedure.description }}
          </p>
        </div>

        <!-- Metadata -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-default">
          <div>
            <label class="text-sm font-medium text-muted">Created</label>
            <p class="mt-1 text-base text-highlighted">
              {{ procedure?.createdAt ? formatDate(procedure.createdAt) : 'Unknown' }}
            </p>
          </div>

          <div>
            <label class="text-sm font-medium text-muted">Last Updated</label>
            <p class="mt-1 text-base text-highlighted">
              {{ procedure?.updatedAt ? formatDate(procedure.updatedAt) : 'Unknown' }}
            </p>
          </div>
        </div>
      </div>
    </UPageCard>
  </div>
</template>

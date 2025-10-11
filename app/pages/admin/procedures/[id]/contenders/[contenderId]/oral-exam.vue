<script setup lang="ts">
const route = useRoute()
const procedureId = computed(() => Number(route.params.id))
const contenderId = computed(() => Number(route.params.contenderId))

// Fetch exam criteria for this procedure
const { data: criteria } = await useFetch(`/api/procedures/${procedureId.value}/exam-criteria`, {
  default: () => [],
})

// Fetch codelist for labels
const { data: criteriaCodelist } = await useFetch('/api/exam-criteria/codelist', {
  default: () => [],
})

// Fetch existing scores for this contender
const { data: existingScores, refresh: refreshScores } = await useFetch(`/api/contenders/${contenderId.value}/exam-scores`, {
  default: () => [],
})

// Initialize form state with existing scores or default values
const scores = ref<Record<number, number>>({})

// Rating options for radio buttons
const ratingItems = [1, 2, 3, 4, 5]

// Populate scores from existing data or initialize to 1
watchEffect(() => {
  if (criteria.value && criteria.value.length > 0) {
    criteria.value.forEach((criterion: any) => {
      // Check if there's an existing score
      const existingScore = existingScores.value.find((s: any) => s.criteriaId === criterion.id)
      if (existingScore) {
        scores.value[criterion.id] = existingScore.score
      }
      else if (!scores.value[criterion.id]) {
        scores.value[criterion.id] = 1 // Default to minimum rating
      }
    })
  }
})

// Get label for a criteria value
function getCriteriaLabel(value: string): string {
  const item = criteriaCodelist.value.find((c: any) => c.value === value)
  return item?.label || value
}

// Get example questions for a criteria value
function getCriteriaExampleQuestions(value: string): string[] {
  const item = criteriaCodelist.value.find((c: any) => c.value === value)
  return item?.exampleQuestions || []
}

const toast = useToast()
const isSubmitting = ref(false)

async function handleSubmit() {
  isSubmitting.value = true

  try {
    // Prepare scores array for submission
    const scoresArray = Object.entries(scores.value).map(([criteriaId, score]) => ({
      criteriaId: Number(criteriaId),
      score,
    }))

    await $fetch(`/api/contenders/${contenderId.value}/exam-scores`, {
      method: 'POST',
      body: {
        scores: scoresArray,
      },
    })

    toast.add({
      title: 'Exam scores saved successfully',
      color: 'success',
    })

    refreshScores()
  }
  catch (error) {
    toast.add({
      title: 'Failed to save exam scores',
      description: (error as { data?: { message?: string } })?.data?.message || 'An error occurred',
      color: 'error',
    })
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div>
    <UPageCard
      title="Oral Exam Evaluation"
      description="Rate the contender on various criteria using a 1-5 scale."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    />

    <UPageCard variant="subtle">
      <div
        v-if="criteria && criteria.length > 0"
        class="space-y-6"
      >
        <div
          v-for="criterion in criteria"
          :key="criterion.id"
          class="space-y-3"
        >
          <label class="text-sm font-medium text-highlighted">
            {{ getCriteriaLabel(criterion.name) }}
          </label>

          <!-- Example Questions Collapsible -->
          <UCollapsible class="mb-3">
            <UButton
              icon="i-lucide-help-circle"
              variant="ghost"
              color="neutral"
              size="xs"
              trailing-icon="i-lucide-chevron-down"
            >
              Example Questions
            </UButton>

            <template #content>
              <div class="bg-subtle rounded-lg p-4 mt-2 space-y-2">
                <p class="text-xs font-medium text-muted mb-3">
                  Example questions to evaluate this criterion:
                </p>
                <ul class="space-y-2">
                  <li
                    v-for="(question, index) in getCriteriaExampleQuestions(criterion.name)"
                    :key="index"
                    class="flex gap-2 text-sm"
                  >
                    <span class="text-primary font-medium shrink-0">{{ index + 1 }}.</span>
                    <span class="text-muted">{{ question }}</span>
                  </li>
                </ul>
              </div>
            </template>
          </UCollapsible>

          <URadioGroup
            v-model="scores[criterion.id]"
            orientation="horizontal"
            variant="card"
            :items="ratingItems"
          />
        </div>

        <div class="pt-4 border-t border-default">
          <UButton
            label="Save Scores"
            color="primary"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            @click="handleSubmit"
          />
        </div>
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center py-12 px-4"
      >
        <UIcon
          name="i-lucide-clipboard-list"
          class="size-12 text-muted mb-4"
        />
        <p class="text-sm text-muted text-center">
          No exam criteria defined for this procedure yet.
        </p>
        <p class="text-xs text-muted text-center mt-2">
          Go to procedure settings to add exam criteria.
        </p>
      </div>
    </UPageCard>
  </div>
</template>

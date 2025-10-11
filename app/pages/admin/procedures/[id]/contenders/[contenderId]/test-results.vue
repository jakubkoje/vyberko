<script setup lang="ts">
const route = useRoute()
const contenderId = computed(() => Number(route.params.contenderId))

const { data: testResults, refresh } = await useFetch(`/api/contenders/${contenderId.value}/test-results`, {
  default: () => [],
})

const { data: examCategoriesCodelist } = await useFetch('/api/exam-categories/codelist', {
  default: () => [],
})

function getCategoryLabel(value: string): string {
  const item = examCategoriesCodelist.value.find((c: any) => c.value === value)
  return item?.label || value
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return 'N/A'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

function formatDate(date: string | null): string {
  if (!date) return 'Not submitted'
  return new Date(date).toLocaleString('sk-SK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div>
    <UPageCard
      title="Test Results"
      description="View all test attempts with questions and answers."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    />

    <div
      v-if="testResults && testResults.length > 0"
      class="space-y-6"
    >
      <UPageCard
        v-for="result in testResults"
        :key="result.id"
        variant="subtle"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-highlighted">
                {{ result.surveyTitle }}
              </h3>
              <div class="flex items-center gap-3 mt-2">
                <UBadge
                  :label="getCategoryLabel(result.surveyCategory)"
                  variant="subtle"
                  color="primary"
                />
                <UBadge
                  v-if="result.isPassed !== null"
                  :label="result.isPassed ? 'Passed' : 'Failed'"
                  :color="result.isPassed ? 'success' : 'error'"
                  variant="subtle"
                />
              </div>
            </div>
            <div class="text-right">
              <div
                v-if="result.score !== null"
                class="text-2xl font-bold text-highlighted"
              >
                {{ result.score }}
                <span
                  v-if="result.totalQuestions"
                  class="text-sm text-muted"
                >
                  / {{ result.totalQuestions }}
                </span>
              </div>
              <div class="text-xs text-muted mt-1">
                {{ result.correctAnswers }} / {{ result.totalQuestions }} correct
              </div>
            </div>
          </div>
        </template>

        <!-- Test metadata -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-y border-default">
          <div>
            <div class="text-xs text-muted">
              Started
            </div>
            <div class="text-sm font-medium text-highlighted">
              {{ formatDate(result.startedAt) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-muted">
              Submitted
            </div>
            <div class="text-sm font-medium text-highlighted">
              {{ formatDate(result.submittedAt) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-muted">
              Time Spent
            </div>
            <div class="text-sm font-medium text-highlighted">
              {{ formatDuration(result.timeSpentSeconds) }}
            </div>
          </div>
        </div>

        <!-- Questions and Answers -->
        <div class="space-y-4 mt-6">
          <h4 class="text-sm font-semibold text-highlighted">
            Questions & Answers
          </h4>

          <div
            v-for="(qa, index) in result.questionsWithAnswers"
            :key="qa.name"
            class="p-4 rounded-lg border border-default"
            :class="{
              'bg-success/5 border-success/20': qa.isCorrect === true,
              'bg-error/5 border-error/20': qa.isCorrect === false,
            }"
          >
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-elevated text-sm font-medium">
                {{ index + 1 }}
              </div>
              <div class="flex-1 space-y-3">
                <!-- Question -->
                <div>
                  <div class="text-sm font-medium text-highlighted mb-2">
                    {{ qa.title }}
                  </div>
                  <div
                    v-if="qa.choices && qa.choices.length > 0"
                    class="space-y-1"
                  >
                    <div
                      v-for="choice in qa.choices"
                      :key="choice.value"
                      class="text-sm text-muted pl-4"
                    >
                      • {{ choice.text || choice.value }}
                    </div>
                  </div>
                </div>

                <!-- User Answer -->
                <div class="flex items-start gap-2">
                  <UIcon
                    v-if="qa.isCorrect === true"
                    name="i-lucide-check-circle"
                    class="size-5 text-success mt-0.5"
                  />
                  <UIcon
                    v-else-if="qa.isCorrect === false"
                    name="i-lucide-x-circle"
                    class="size-5 text-error mt-0.5"
                  />
                  <div>
                    <div class="text-xs font-medium text-muted uppercase tracking-wide">
                      User Answer
                    </div>
                    <div class="text-sm font-medium text-highlighted mt-1">
                      <span v-if="qa.userAnswer !== undefined && qa.userAnswer !== null">
                        {{ qa.userAnswer }}
                      </span>
                      <span
                        v-else
                        class="italic text-muted"
                      >
                        No answer provided
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Correct Answer (if available and wrong) -->
                <div
                  v-if="qa.correctAnswer !== undefined && qa.isCorrect === false"
                  class="flex items-start gap-2"
                >
                  <UIcon
                    name="i-lucide-lightbulb"
                    class="size-5 text-warning mt-0.5"
                  />
                  <div>
                    <div class="text-xs font-medium text-muted uppercase tracking-wide">
                      Correct Answer
                    </div>
                    <div class="text-sm font-medium text-success mt-1">
                      {{ qa.correctAnswer }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UPageCard>
    </div>

    <UPageCard
      v-else
      variant="subtle"
    >
      <div class="flex flex-col items-center justify-center py-12 px-4">
        <UIcon
          name="i-lucide-clipboard-list"
          class="size-12 text-muted mb-4"
        />
        <p class="text-sm text-muted text-center">
          No test results available yet.
        </p>
        <p class="text-xs text-muted text-center mt-2">
          Test results will appear here once the candidate completes their tests.
        </p>
      </div>
    </UPageCard>
  </div>
</template>

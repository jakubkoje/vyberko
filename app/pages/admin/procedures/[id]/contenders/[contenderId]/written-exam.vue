<script setup lang="ts">
const route = useRoute()
const procedureId = computed(() => Number(route.params.id))
const contenderId = computed(() => Number(route.params.contenderId))

// Fetch procedure to get survey info
const { data: procedure } = await useFetch(`/api/procedures/${procedureId.value}`)

// Fetch survey responses for this contender
const { data: surveyResponse } = await useFetch(`/api/contenders/${contenderId.value}/survey-response`, {
  default: () => null,
})

// Fetch survey definition if procedure has a survey
const { data: survey } = await useFetch(
  () => procedure.value?.surveyId ? `/api/surveys/${procedure.value.surveyId}` : null,
  {
    default: () => null,
  },
)

// Function to get question text from survey definition
function getQuestionText(questionName: string): string {
  if (!survey.value?.jsonData) return questionName

  // Iterate through pages and elements to find the question
  for (const page of survey.value.jsonData.pages || []) {
    for (const element of page.elements || []) {
      if (element.name === questionName) {
        return element.title || element.name
      }
    }
  }

  return questionName
}

// Function to get question type from survey definition
function getQuestionType(questionName: string): string {
  if (!survey.value?.jsonData) return 'text'

  for (const page of survey.value.jsonData.pages || []) {
    for (const element of page.elements || []) {
      if (element.name === questionName) {
        return element.type || 'text'
      }
    }
  }

  return 'text'
}

// Format answer based on type
function formatAnswer(questionName: string, answer: any): string {
  const type = getQuestionType(questionName)

  if (answer === null || answer === undefined) {
    return 'Not answered'
  }

  if (type === 'rating') {
    return `${answer} / 5`
  }

  if (Array.isArray(answer)) {
    return answer.join(', ')
  }

  if (typeof answer === 'object') {
    return JSON.stringify(answer, null, 2)
  }

  return String(answer)
}

// Calculate completion percentage
const completionPercentage = computed(() => {
  if (!survey.value?.jsonData || !surveyResponse.value?.data) {
    return 0
  }

  const totalQuestions = survey.value.jsonData.pages?.reduce((count: number, page: any) => {
    return count + (page.elements?.length || 0)
  }, 0) || 0

  if (totalQuestions === 0) return 0

  const answeredQuestions = Object.keys(surveyResponse.value.data).length

  return Math.round((answeredQuestions / totalQuestions) * 100)
})

// Get score if available
const score = computed(() => {
  if (!surveyResponse.value?.score) return null
  return surveyResponse.value.score
})
</script>

<template>
  <div>
    <UPageCard
      title="Written Exam Results"
      description="View the contender's survey responses and performance."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    />

    <!-- No Survey Assigned -->
    <UPageCard
      v-if="!procedure?.surveyId"
      variant="subtle"
    >
      <div class="flex flex-col items-center justify-center py-12 px-4">
        <UIcon
          name="i-lucide-file-question"
          class="size-12 text-muted mb-4"
        />
        <p class="text-sm text-muted text-center">
          No written exam (survey) assigned to this procedure yet.
        </p>
        <p class="text-xs text-muted text-center mt-2">
          Go to procedure settings to assign a survey.
        </p>
      </div>
    </UPageCard>

    <!-- No Response Yet -->
    <UPageCard
      v-else-if="!surveyResponse"
      variant="subtle"
    >
      <div class="flex flex-col items-center justify-center py-12 px-4">
        <UIcon
          name="i-lucide-hourglass"
          class="size-12 text-muted mb-4"
        />
        <p class="text-sm text-muted text-center">
          This contender hasn't completed the written exam yet.
        </p>
        <p class="text-xs text-muted text-center mt-2">
          Share the exam access code with the contender to begin.
        </p>
      </div>
    </UPageCard>

    <!-- Survey Results -->
    <div
      v-else
      class="space-y-4"
    >
      <!-- Summary Card -->
      <UPageCard variant="subtle">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-highlighted mb-1">
              {{ survey?.title || 'Written Exam' }}
            </h3>
            <p class="text-xs text-muted">
              Submitted on {{ new Date(surveyResponse.submittedAt).toLocaleDateString() }} at {{ new Date(surveyResponse.submittedAt).toLocaleTimeString() }}
            </p>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-highlighted">
              {{ completionPercentage }}%
            </div>
            <div class="text-xs text-muted">
              Completion
            </div>
          </div>
        </div>

        <div
          v-if="score !== null"
          class="mt-4 pt-4 border-t border-default"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-muted">Score</span>
            <span class="text-lg font-bold text-primary">{{ score }}%</span>
          </div>
        </div>
      </UPageCard>

      <!-- Responses -->
      <UPageCard variant="subtle">
        <div class="space-y-6">
          <div
            v-for="(answer, questionName) in surveyResponse.data"
            :key="questionName"
            class="space-y-2"
          >
            <dt class="text-sm font-medium text-highlighted">
              {{ getQuestionText(String(questionName)) }}
            </dt>
            <dd class="text-sm text-muted pl-4">
              {{ formatAnswer(String(questionName), answer) }}
            </dd>
          </div>
        </div>
      </UPageCard>
    </div>
  </div>
</template>

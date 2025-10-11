<template>
  <div class="min-h-screen bg-background">
    <div class="container mx-auto py-8">
      <div class="mb-6">
        <h1 class="text-3xl font-bold">
          Digitálny výberový test
        </h1>
        <p class="text-muted text-sm mt-1">
          Prístupový kód: <UBadge color="gray" variant="subtle">{{ code }}</UBadge>
        </p>
      </div>

      <!-- Loading State -->
      <UCard v-if="isLoading">
        <div class="flex flex-col items-center justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="text-4xl text-primary animate-spin mb-4" />
          <p class="text-lg text-muted">Načítavanie testu...</p>
        </div>
      </UCard>

      <!-- Error State -->
      <UAlert
        v-else-if="error"
        color="red"
        variant="solid"
        title="Chyba pri načítavaní testu"
        :description="error"
        icon="i-lucide-alert-circle"
      >
        <template #actions>
          <UButton
            color="white"
            variant="outline"
            @click="fetchTestConfiguration"
          >
            Skúsiť znova
          </UButton>
        </template>
      </UAlert>

      <!-- Test Content -->
      <ClientOnly v-else-if="surveyConfig">
        <SurveyCustomPreview
          :survey-data="surveyConfig"
          :start-date="startDate"
          :end-date="endDate"
          :access-code="code"
          @complete="handleComplete"
          @time-expired="handleTimeExpired"
        />
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const code = ref(route.query.code as string || '')
const isCompleted = ref(false)
const isLoading = ref(true)
const surveyConfig = ref<any>(null)
const error = ref<string | null>(null)
const startDate = ref<string | null>(null)
const endDate = ref<string | null>(null)

// Redirect if no code
if (!code.value) {
  navigateTo('/')
}

// Fetch test configuration from backend
const fetchTestConfiguration = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    // TODO: Replace with actual API call in production
    // const response = await $fetch(`/api/test/configuration`, {
    //   query: { code: code.value }
    // })
    
    // For now, use the example JSON structure
    const response = await $fetch('/test.example.json')
    surveyConfig.value = response
    
    // Use startDate and endDate directly from backend response
    // This ensures timer is based on absolute dates, not calculated on each load
    if (surveyConfig.value.showTimer) {
      // Check if backend provided startDate and endDate
      if (response.startDate && response.endDate) {
        // Use dates from backend (preferred method)
        startDate.value = response.startDate
        endDate.value = response.endDate
        
        console.log('Using dates from backend:', {
          start: startDate.value,
          end: endDate.value
        })
      } else {
        // Fallback: Calculate if not provided (backwards compatibility)
        const now = new Date()
        startDate.value = now.toISOString()
        
        const duration = surveyConfig.value.maxTimeToFinish || surveyConfig.value.timeLimit || 1800
        const end = new Date(now.getTime() + duration * 1000)
        endDate.value = end.toISOString()
        
        console.log('Calculated dates (fallback):', {
          start: startDate.value,
          end: endDate.value
        })
      }
    }
  } catch (e: any) {
    error.value = e.message || 'Nepodarilo sa načítať konfiguráciu testu'
    console.error('Failed to fetch test configuration:', e)
  } finally {
    isLoading.value = false
  }
}

// Fetch configuration on mount
onMounted(() => {
  fetchTestConfiguration()
})

// Calculate score based on correct answers
const calculateScore = (answers: any) => {
  if (!surveyConfig.value?.pages) return { score: 0, total: 0, percentage: 0, details: [] }
  
  let correctCount = 0
  let totalQuestions = 0
  const details: any[] = []
  
  // Iterate through all pages and elements
  surveyConfig.value.pages.forEach((page: any) => {
    page.elements?.forEach((element: any) => {
      // Only check elements that have correctAnswer defined
      if (element.correctAnswer !== undefined && element.name) {
        totalQuestions++
        const userAnswer = answers[element.name]
        let isCorrect = false
        
        // Handle different types
        if (element.type === 'checkbox') {
          // For checkboxes, compare arrays
          const correctAnswers = Array.isArray(element.correctAnswer) 
            ? element.correctAnswer 
            : [element.correctAnswer]
          const userAnswers = Array.isArray(userAnswer) ? userAnswer : []
          
          // Check if arrays have same elements (order doesn't matter)
          isCorrect = correctAnswers.length === userAnswers.length &&
            correctAnswers.every((ans: string) => userAnswers.includes(ans))
        } else {
          // For other types, direct comparison
          isCorrect = userAnswer === element.correctAnswer
        }
        
        if (isCorrect) correctCount++
        
        details.push({
          name: element.name,
          title: element.title,
          type: element.type,
          userAnswer,
          correctAnswer: element.correctAnswer,
          isCorrect
        })
      }
    })
  })
  
  const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0
  
  return {
    score: correctCount,
    total: totalQuestions,
    percentage: Math.round(percentage * 100) / 100,
    details
  }
}

// Calculate time spent
const calculateTimeSpent = () => {
  if (!startDate.value || !endDate.value) return null
  
  const start = new Date(startDate.value)
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()
  return Math.floor(diffMs / 1000) // Time spent in seconds
}

// Handle survey completion
const handleComplete = async (results: any) => {
  isCompleted.value = true
  console.log('Survey results:', results)
  
  // Calculate score
  const scoreData = calculateScore(results)
  console.log('Score:', scoreData)
  
  // TODO: Send results to backend
  try {
    const timeSpent = calculateTimeSpent()
    
    // await $fetch('/api/test/submit', {
    //   method: 'POST',
    //   body: {
    //     code: code.value,
    //     results,
    //     score: scoreData,
    //     timeSpent,
    //     completedAt: new Date().toISOString()
    //   }
    // })
    
    // Clear saved progress
    if (process.client) {
      localStorage.removeItem(`test-progress-${code.value}`)
      // Store results temporarily for results page
      localStorage.setItem(`test-results-${code.value}`, JSON.stringify(scoreData))
    }
    
    // Navigate to results page after delay
    setTimeout(() => {
      navigateTo(`/test-results?code=${code.value}`)
    }, 1500)
  } catch (error) {
    console.error('Failed to submit results:', error)
  }
}

// Handle time expiration
const handleTimeExpired = async (results: any) => {
  if (isCompleted.value) return // Prevent double submission
  
  console.log('Time expired! Auto-submitting...')
  
  // Show alert
  alert('Čas vypršal! Test bude automaticky odoslaný.')
  
  // Submit with current answers
  await handleComplete(results)
}
</script>


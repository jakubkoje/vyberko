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
      <ClientOnly v-else-if="currentTest">
        <div class="mb-6">
          <div class="flex justify-between items-center mb-4">
            <div>
              <h2 class="text-2xl font-semibold">{{ currentTest.title }}</h2>
              <p class="text-muted">{{ currentTest.description }}</p>
            </div>
            <UBadge color="blue" variant="soft">
              Test {{ currentTestIndex + 1 }} z {{ tests.length }}
            </UBadge>
          </div>
          
          <!-- Progress Bar -->
          <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              class="bg-primary h-2 rounded-full transition-all duration-300"
              :style="{ width: `${((currentTestIndex + 1) / tests.length) * 100}%` }"
            ></div>
          </div>
        </div>
        
        <SurveyCustomPreview
          :survey-data="currentTest"
          :start-date="startDate"
          :end-date="endDate"
          :access-code="code"
          @complete="handleTestComplete"
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
const tests = ref<any[]>([])
const session = ref<any>(null)
const currentTestIndex = ref(0)
const testResults = ref<any[]>([])
const error = ref<string | null>(null)
const startDate = ref<string | null>(null)
const endDate = ref<string | null>(null)

const currentTest = computed(() => tests.value[currentTestIndex.value])
const isLastTest = computed(() => currentTestIndex.value >= tests.value.length - 1)

// Redirect if no code
if (!code.value) {
  navigateTo('/')
}

// Fetch test configuration from backend
const fetchTestConfiguration = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    // Fetch multiple tests from API
    const response = await $fetch(`/api/test/configuration`, {
      query: { code: code.value }
    })

    console.log('Response:', response)
    
    tests.value = response.tests
    session.value = response.session
    currentTestIndex.value = session.value.currentTestIndex || 0
    
    // Use session dates for timer
    if (session.value) {
      startDate.value = session.value.startDate
      endDate.value = session.value.endDate
      
      console.log('Using session dates:', {
        start: startDate.value,
        end: endDate.value,
        currentTest: currentTestIndex.value
      })
    } else {
      // Fallback: Calculate if not provided
      const now = new Date()
      startDate.value = now.toISOString()
      
      const duration = 900 // 15 minutes total for all tests
      const end = new Date(now.getTime() + duration * 1000)
      endDate.value = end.toISOString()
      
      console.log('Calculated dates (fallback):', {
        start: startDate.value,
        end: endDate.value
      })
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
const calculateScore = (answers: any, testConfig: any) => {
  if (!testConfig?.pages) return { score: 0, total: 0, percentage: 0, details: [] }
  
  let correctCount = 0
  let totalQuestions = 0
  const details: any[] = []
  
  // Iterate through all pages and elements
  testConfig.pages.forEach((page: any) => {
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

// Handle individual test completion
const handleTestComplete = (results: any) => {
  console.log('Test completed:', results)
  
  // Calculate score for current test
  const score = calculateScore(results.data, currentTest.value)
  
  // Store test result
  const testResult = {
    testId: currentTest.value.id,
    testTitle: currentTest.value.title,
    score,
    data: results.data,
    timestamp: new Date().toISOString()
  }
  
  testResults.value.push(testResult)
  
  // Check if this is the last test
  if (isLastTest.value) {
    // All tests completed, navigate to results
    handleAllTestsComplete()
  } else {
    // Move to next test
    currentTestIndex.value++
    
    // Update session
    if (session.value) {
      session.value.currentTestIndex = currentTestIndex.value
      session.value.completedTests.push(testResult.testId)
    }
  }
}

// Handle completion of all tests
const handleAllTestsComplete = () => {
  console.log('All tests completed:', testResults.value)
  
  // Calculate overall score
  const totalScore = testResults.value.reduce((sum, result) => sum + result.score, 0)
  const totalQuestions = testResults.value.reduce((sum, result) => sum + result.total, 0)
  const overallPercentage = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0
  
  // Store all results in localStorage
  const finalResults = {
    tests: testResults.value,
    overall: {
      score: totalScore,
      total: totalQuestions,
      percentage: Math.round(overallPercentage)
    },
    timestamp: new Date().toISOString(),
    accessCode: code.value
  }
  
  localStorage.setItem(`test-results-${code.value}`, JSON.stringify(finalResults))
  
  // Navigate to results page
  navigateTo(`/test-results?code=${code.value}`)
}

// Handle time expiration
const handleTimeExpired = async (results: any) => {
  if (isCompleted.value) return // Prevent double submission
  
  console.log('Time expired! Auto-submitting...')
  
  // Show alert
  alert('Čas vypršal! Test bude automaticky odoslaný.')
  
  // Submit with current answers
  await handleTestComplete(results)
}

useSeoMeta({
  title: 'Digitálny výberový test',
  description: 'Absolvujte digitálny výberový test pre štátnu službu.'
})
</script>
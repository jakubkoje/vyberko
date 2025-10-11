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

      <!-- Transition Screen -->
      <UCard v-else-if="isTransitioning && lastCompletedScore">
        <div class="flex flex-col items-center justify-center py-12">
          <UIcon name="i-lucide-check-circle" class="text-6xl text-success mb-4" />
          <h2 class="text-2xl font-bold mb-2">Test úspešný!</h2>
          <p class="text-muted mb-6">
            Dosiahli ste požadovaný počet bodov.
          </p>
          <div class="flex items-center gap-2 text-primary">
            <UIcon name="i-lucide-loader-2" class="animate-spin" />
            <span>Načítavam ďalší test...</span>
          </div>
        </div>
      </UCard>

      <!-- Test Content -->
      <ClientOnly v-else-if="currentTest && !isTransitioning">
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
const toast = useToast()
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
const isTransitioning = ref(false)
const lastCompletedScore = ref<any>(null)

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

    // Set start date to now (each test has its own timer)
    startDate.value = new Date().toISOString()

    // Calculate end date for current test based on its timeLimit
    if (currentTest.value?.timeLimit) {
      const now = new Date()
      const end = new Date(now.getTime() + currentTest.value.timeLimit * 1000)
      endDate.value = end.toISOString()
    } else {
      endDate.value = null
    }

    console.log('Test timer configuration:', {
      testIndex: currentTestIndex.value,
      testTitle: currentTest.value?.title,
      timeLimit: currentTest.value?.timeLimit,
      start: startDate.value,
      end: endDate.value
    })
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

// Update timer when test changes
watch(currentTestIndex, () => {
  if (currentTest.value) {
    // Reset timer for new test
    startDate.value = new Date().toISOString()

    if (currentTest.value.timeLimit) {
      const now = new Date()
      const end = new Date(now.getTime() + currentTest.value.timeLimit * 1000)
      endDate.value = end.toISOString()
    } else {
      endDate.value = null
    }

    console.log('Test timer updated:', {
      testIndex: currentTestIndex.value,
      testTitle: currentTest.value.title,
      timeLimit: currentTest.value.timeLimit,
      start: startDate.value,
      end: endDate.value
    })
  }
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
const handleTestComplete = async (answersData: any) => {
  console.log('Test completed with answers:', answersData)

  // Calculate score for current test
  const score = calculateScore(answersData, currentTest.value)
  const isPassed = score.percentage >= 60

  // Store test result (with pass/fail status only)
  const testResult = {
    testId: currentTest.value.id,
    surveyId: currentTest.value.surveyId,
    testTitle: currentTest.value.title,
    isPassed,
    timestamp: new Date().toISOString(),
  }

  testResults.value.push(testResult)

  // Calculate time spent
  const timeSpent = startDate.value
    ? Math.floor((new Date().getTime() - new Date(startDate.value).getTime()) / 1000)
    : null

  // Submit test results to API
  try {
    await $fetch('/api/test/submit', {
      method: 'POST',
      body: {
        code: code.value,
        surveyId: currentTest.value.surveyId,
        testId: currentTest.value.id,
        answersData,
        score: score.score,
        totalQuestions: score.total,
        isPassed,
        timeSpent,
        startedAt: startDate.value,
      }
    })
    console.log('Test result saved to database')
  } catch (err) {
    console.error('Failed to save test result:', err)
    toast.add({
      title: 'Chyba pri ukladaní',
      description: 'Nepodarilo sa uložiť výsledky testu. Skúste to prosím znova.',
      color: 'red',
      timeout: 5000,
    })
    return
  }

  // Check if passed
  if (!isPassed) {
    // Failed - show notification and block progression
    toast.add({
      title: 'Test neúspešný',
      description: 'Nedosiahli ste požadovaný počet bodov. Výberové konanie pokračovať nemôže.',
      color: 'red',
      timeout: 0, // Don't auto-dismiss
    })

    // Store failed result and navigate to results
    const finalResults = {
      tests: testResults.value,
      overall: {
        passed: false
      },
      timestamp: new Date().toISOString(),
      accessCode: code.value
    }
    localStorage.setItem(`test-results-${code.value}`, JSON.stringify(finalResults))

    // Navigate to results after short delay
    setTimeout(() => {
      navigateTo(`/test-results?code=${code.value}`)
    }, 2000)
    return
  }

  // Passed - show success notification
  toast.add({
    title: 'Test úspešný!',
    description: 'Dosiahli ste požadovaný počet bodov.',
    color: 'green',
    timeout: 3000,
  })

  // Check if this is the last test
  if (isLastTest.value) {
    // All tests completed, navigate to results
    handleAllTestsComplete()
  } else {
    // Show transition screen
    isTransitioning.value = true
    lastCompletedScore.value = { isPassed: true }

    // Move to next test after a short delay
    setTimeout(() => {
      currentTestIndex.value++

      // Update session
      if (session.value) {
        session.value.currentTestIndex = currentTestIndex.value
        session.value.completedTests.push(testResult.testId)
      }

      // Hide transition screen
      isTransitioning.value = false
      lastCompletedScore.value = null
    }, 2500)
  }
}

// Handle completion of all tests
const handleAllTestsComplete = () => {
  console.log('All tests completed:', testResults.value)

  // All tests passed if we got here (failures block earlier)
  const allPassed = testResults.value.every(result => result.isPassed)

  // Store only pass/fail status in localStorage
  const finalResults = {
    tests: testResults.value, // Contains only testId, title, isPassed
    overall: {
      passed: allPassed
    },
    timestamp: new Date().toISOString(),
    accessCode: code.value
  }

  localStorage.setItem(`test-results-${code.value}`, JSON.stringify(finalResults))

  // Navigate to results page
  navigateTo(`/test-results?code=${code.value}`)
}

// Handle time expiration
const handleTimeExpired = async (answersData: any) => {
  if (isCompleted.value) return // Prevent double submission

  console.log('Time expired! Auto-submitting...', answersData)

  // Show notification
  toast.add({
    title: 'Čas vypršal!',
    description: 'Test bol automaticky odoslaný.',
    color: 'orange',
    timeout: 5000,
  })

  // Submit with current answers
  await handleTestComplete(answersData)
}

useSeoMeta({
  title: 'Digitálny výberový test',
  description: 'Absolvujte digitálny výberový test pre štátnu službu.'
})
</script>
<template>
  <div class="custom-survey-preview p-6">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold">
              {{ surveyData.title || 'Náhľad testu' }}
            </h2>
            <p
              v-if="surveyData.description"
              class="text-muted text-sm mt-1"
            >
              {{ surveyData.description }}
            </p>
          </div>
          <div class="flex items-center gap-4">
            <!-- Auto-Save Indicator -->
            <UBadge
              v-if="lastSavedTime"
              color="green"
              variant="soft"
              size="sm"
            >
              <UIcon
                :name="isSaving ? 'i-lucide-loader-2' : 'i-lucide-check'"
                :class="{ 'animate-spin': isSaving }"
                class="mr-1"
              />
              {{ isSaving ? 'Ukladá sa...' : 'Uložené' }}
            </UBadge>
            
            <!-- Timer Badge -->
            <UBadge
              v-if="showTimer && timeRemaining !== null"
              :color="timeRemaining < 300 ? 'red' : timeRemaining < 600 ? 'orange' : 'primary'"
              size="xl"
              variant="soft"
              class="text-xl font-bold"
            >
              <UIcon name="i-lucide-clock" class="mr-1" />
              {{ formatTime(timeRemaining) }}
            </UBadge>
            
            <!-- Page Counter -->
            <UBadge
              v-if="currentPageIndex < totalPages - 1"
              color="gray"
              size="lg"
              variant="subtle"
            >
              Strana {{ currentPageIndex + 1 }} / {{ totalPages }}
            </UBadge>
          </div>
        </div>
      </template>

      <div class="space-y-6">
        <!-- Progress bar -->
        <!-- <UProgress
          v-if="surveyData.showProgressBar !== 'off'"
          :value="progressPercentage"
          size="md"
        /> -->

        <!-- Current page -->
        <div
          v-if="currentPage"
          class="space-y-6"
        >
          <div v-if="currentPage.title || currentPage.description">
            <h3
              v-if="currentPage.title"
              class="text-xl font-semibold"
            >
              {{ currentPage.title }}
            </h3>
            <p
              v-if="currentPage.description"
              class="text-muted mt-2"
            >
              {{ currentPage.description }}
            </p>
          </div>

          <!-- Questions/Elements -->
          <div class="space-y-6">
            <div
              v-for="(element, index) in currentPage.elements"
              :key="element.name"
              class="pb-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0"
            >
              <!-- Question Number (if not HTML) -->
              <div
                v-if="element.type !== 'html'"
                class="text-sm font-semibold text-primary mb-2"
              >
                {{ element?.title}}
              </div>

              <!-- HTML Element -->
              <div
                v-if="element.type === 'html'"
                v-html="element.html"
              />

              <!-- Text Input -->
              <UFormGroup
                v-else-if="element.type === 'text'"
                :label="element.title"
                :required="element.isRequired"
                :help="element.description"
              >
                <UInput
                  v-model="answers[element.name]"
                  :placeholder="element.placeholder"
                  :type="element.inputType || 'text'"
                  size="lg"
                />
              </UFormGroup>

              <!-- Email Input -->
              <UFormGroup
                v-else-if="element.inputType === 'email'"
                :label="element.title"
                :required="element.isRequired"
                :help="element.description"
              >
                <UInput
                  v-model="answers[element.name]"
                  :placeholder="element.placeholder"
                  type="email"
                  size="lg"
                />
              </UFormGroup>

              <!-- Comment/Textarea -->
              <UFormGroup
                v-else-if="element.type === 'comment'"
                :label="element.title"
                :required="element.isRequired"
                :help="element.description"
              >
                <UTextarea
                  v-model="answers[element.name]"
                  :placeholder="element.placeholder"
                  :rows="element.rows || 4"
                  :maxlength="element.maxLength"
                  size="lg"
                />
                <template #help>
                  <div class="flex justify-between items-center mt-1">
                    <span v-if="element.description">{{ element.description }}</span>
                    <span
                      v-if="element.maxLength"
                      class="text-xs text-muted"
                    >
                      {{ (answers[element.name]?.length || 0) }} / {{ element.maxLength }}
                    </span>
                  </div>
                </template>
              </UFormGroup>

              <!-- Dropdown/Select -->
              <UFormGroup
                v-else-if="element.type === 'dropdown'"
                :label="element.title"
                :required="element.isRequired"
                :help="element.description"
              >
                <USelect
                  v-model="answers[element.name]"
                  :options="getChoices(element.choices)"
                  placeholder="Vyberte možnosť"
                  size="lg"
                />
              </UFormGroup>

              <!-- Radio Group -->
              <UFormGroup
                v-else-if="element.type === 'radiogroup'"
                :label="element.title"
                :required="element.isRequired"
                :help="element.description"
              >
                <URadioGroup
                  v-model="answers[element.name]"
                  :items="getChoices(element.choices)"
                />
              </UFormGroup>

              <!-- Checkbox Group -->
              <UFormGroup
                v-else-if="element.type === 'checkbox'"
                :label="element.title"
                :required="element.isRequired"
                :help="element.description"
              >
                <div class="space-y-2">
                  <UCheckbox
                    v-for="choice in getChoices(element.choices)"
                    :key="choice.value"
                    :model-value="isCheckboxChecked(element.name, choice.value)"
                    :label="choice.label"
                    @update:model-value="(checked) => toggleCheckbox(element.name, choice.value, checked)"
                  />
                </div>
              </UFormGroup>

              <!-- Boolean/Yes-No -->
              <UFormGroup
                v-else-if="element.type === 'boolean'"
                :label="element.title"
                :required="element.isRequired"
                :help="element.description"
              >
                <UToggle
                  v-model="answers[element.name]"
                  size="lg"
                />
              </UFormGroup>

              <!-- Rating -->
              <UFormGroup
                v-else-if="element.type === 'rating'"
                :label="element.title"
                :required="element.isRequired"
                :help="element.description"
              >
                <div class="flex gap-2">
                  <UButton
                    v-for="n in (element.rateMax || 5)"
                    :key="n"
                    :variant="answers[element.name] === n ? 'solid' : 'outline'"
                    :color="answers[element.name] === n ? 'primary' : 'gray'"
                    @click="answers[element.name] = n"
                  >
                    {{ n }}
                  </UButton>
                </div>
              </UFormGroup>
            </div>
          </div>
        </div>

        <!-- Completion message -->
        <div
          v-if="isCompleted"
          class="text-center py-8"
        >
          <UIcon
            name="i-lucide-check-circle"
            class="text-green-500 text-6xl mb-4"
          />
          <h3 class="text-2xl font-bold mb-2">
            Ďakujeme za dokončenie testu!
          </h3>
          <p class="text-muted">
            Vaše odpovede boli úspešne odoslané.
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <UButton
            v-if="currentPageIndex > 0"
            variant="outline"
            size="lg"
            @click="previousPage"
          >
            <template #leading>
              <UIcon name="i-lucide-chevron-left" />
            </template>
            Späť
          </UButton>
          <div v-else />

          <UButton
            v-if="currentPageIndex < totalPages - 1"
            color="primary"
            size="lg"
            @click="nextPage"
          >
            Ďalej
            <template #trailing>
              <UIcon name="i-lucide-chevron-right" />
            </template>
          </UButton>
          <UButton
            v-else
            color="primary"
            size="lg"
            @click="completeSurvey"
          >
            Odoslať test
            <template #trailing>
              <UIcon name="i-lucide-send" />
            </template>
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
interface SurveyElement {
  type: string
  name: string
  title?: string
  description?: string
  html?: string
  isRequired?: boolean
  placeholder?: string
  inputType?: string
  rows?: number
  maxLength?: number
  choices?: Array<string | { value: string; text: string }>
  rateMax?: number
  [key: string]: any
}

interface SurveyPage {
  name: string
  title?: string
  description?: string
  elements: SurveyElement[]
}

interface SurveyData {
  title?: string
  description?: string
  showProgressBar?: string
  pages: SurveyPage[]
  [key: string]: any
}

interface Props {
  surveyData: SurveyData
  startDate?: string | Date | null
  endDate?: string | Date | null
  accessCode?: string
}

const props = withDefaults(defineProps<Props>(), {
  startDate: null,
  endDate: null,
  accessCode: undefined
})

const emit = defineEmits(['complete', 'timeExpired'])

const currentPageIndex = ref(0)
const answers = ref<Record<string, any>>({})
const isCompleted = ref(false)
const timeRemaining = ref<number | null>(null)
const showTimer = ref(false)
const isSaving = ref(false)
const lastSavedTime = ref<string | null>(null)

// Generate storage key based on access code
const getStorageKey = () => {
  return props.accessCode ? `test-answers-${props.accessCode}` : 'test-answers-default'
}

const currentPage = computed(() => props.surveyData.pages?.[currentPageIndex.value])
const totalPages = computed(() => props.surveyData.pages?.length || 0)
const progressPercentage = computed(() => {
  if (totalPages.value === 0) return 0
  return ((currentPageIndex.value + 1) / totalPages.value) * 100
})

const getChoices = (choices?: Array<string | { value: string; text: string }>) => {
  if (!choices) return []
  return choices.map(choice => {
    if (typeof choice === 'string') {
      return { label: choice, value: choice }
    }
    return { label: choice.text, value: choice.value }
  })
}

// Checkbox helpers
const isCheckboxChecked = (name: string, value: string) => {
  const current = answers.value[name]
  if (!Array.isArray(current)) return false
  return current.includes(value)
}

const toggleCheckbox = (name: string, value: string, checked: boolean) => {
  if (!answers.value[name]) {
    answers.value[name] = []
  }
  
  if (!Array.isArray(answers.value[name])) {
    answers.value[name] = []
  }
  
  const currentArray = answers.value[name] as string[]
  
  if (checked) {
    // Add value if not already present
    if (!currentArray.includes(value)) {
      answers.value[name] = [...currentArray, value]
    }
  } else {
    // Remove value
    answers.value[name] = currentArray.filter(v => v !== value)
  }
}

// Timer functions
const formatTime = (seconds: number) => {
  if (seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const calculateTimeRemaining = () => {
  if (!props.endDate) return null
  
  const now = new Date()
  const end = new Date(props.endDate)
  const diffMs = end.getTime() - now.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  
  return diffSeconds > 0 ? diffSeconds : 0
}

const handleTimeExpired = () => {
  if (!isCompleted.value) {
    isCompleted.value = true
    emit('timeExpired', answers.value)
  }
}

// Timer interval
let timerInterval: NodeJS.Timeout | null = null

const startTimer = () => {
  if (!props.startDate || !props.endDate) {
    showTimer.value = false
    return
  }

  showTimer.value = true
  
  // Calculate initial time
  const remaining = calculateTimeRemaining()
  if (remaining !== null) {
    timeRemaining.value = remaining
    
    // If already expired, handle immediately
    if (remaining === 0) {
      handleTimeExpired()
      return
    }
  }

  // Update timer every second
  timerInterval = setInterval(() => {
    const remaining = calculateTimeRemaining()
    
    if (remaining !== null) {
      timeRemaining.value = remaining
      
      if (remaining === 0) {
        if (timerInterval) {
          clearInterval(timerInterval)
        }
        handleTimeExpired()
      }
    }
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

// Navigation
const nextPage = () => {
  if (currentPageIndex.value < totalPages.value - 1) {
    currentPageIndex.value++
    // Save current page index to localStorage
    saveToLocalStorage()
  }
}

const previousPage = () => {
  if (currentPageIndex.value > 0) {
    currentPageIndex.value--
    // Save current page index to localStorage
    saveToLocalStorage()
  }
}

const completeSurvey = () => {
  isCompleted.value = true
  stopTimer()
  
  // Clear localStorage on completion
  clearLocalStorage()
  
  emit('complete', answers.value)
}

// localStorage functions
const saveToLocalStorage = () => {
  if (!process.client) return
  
  try {
    isSaving.value = true
    
    const storageKey = getStorageKey()
    const timestamp = new Date().toISOString()
    const dataToSave = {
      answers: answers.value,
      currentPageIndex: currentPageIndex.value,
      lastSaved: timestamp
    }
    
    localStorage.setItem(storageKey, JSON.stringify(dataToSave))
    lastSavedTime.value = timestamp
    
    console.log(`💾 Answers auto-saved for ${props.accessCode || 'default'}`)
    
    // Show "saving" indicator briefly
    setTimeout(() => {
      isSaving.value = false
    }, 500)
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
    isSaving.value = false
  }
}

const loadFromLocalStorage = () => {
  if (!process.client) return
  
  try {
    const storageKey = getStorageKey()
    const savedData = localStorage.getItem(storageKey)
    
    if (savedData) {
      const parsed = JSON.parse(savedData)
      answers.value = parsed.answers || {}
      currentPageIndex.value = parsed.currentPageIndex || 0
      lastSavedTime.value = parsed.lastSaved || null
      
      console.log(`📂 Loaded saved answers for ${props.accessCode || 'default'}`, {
        answersCount: Object.keys(answers.value).length,
        lastSaved: parsed.lastSaved
      })
      
      // Show notification to user
      if (Object.keys(answers.value).length > 0) {
        // Could emit an event or show toast here
        console.log('ℹ️ Obnovené neuložené odpovede')
      }
      
      return true
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error)
  }
  
  return false
}

const clearLocalStorage = () => {
  if (!process.client) return
  
  try {
    const storageKey = getStorageKey()
    localStorage.removeItem(storageKey)
    console.log(`🗑️ Cleared saved answers for ${props.accessCode || 'default'}`)
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
  }
}

// Debounced save to prevent excessive saves on typing
let saveTimeout: NodeJS.Timeout | null = null

const debouncedSave = () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  
  saveTimeout = setTimeout(() => {
    saveToLocalStorage()
  }, 500) // Wait 500ms after last change
}

// Watch answers and auto-save (debounced)
watch(answers, () => {
  if (!isCompleted.value) {
    debouncedSave()
  }
}, { deep: true })

// Also save when navigating between pages (immediate, not debounced)
watch(currentPageIndex, () => {
  if (!isCompleted.value) {
    saveToLocalStorage()
  }
})

// Lifecycle
onMounted(() => {
  // Load saved answers first
  loadFromLocalStorage()
  
  // Then start timer
  startTimer()
})

onBeforeUnmount(() => {
  stopTimer()
  
  // Clear save timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
})
</script>

<style scoped>
:deep(ul) {
  list-style: disc;
  margin-left: 1.5rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

:deep(li) {
  margin-bottom: 0.25rem;
}

:deep(strong) {
  font-weight: 600;
}

:deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}
</style>


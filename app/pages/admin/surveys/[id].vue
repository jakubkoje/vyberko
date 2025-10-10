<template>
  <UDashboardPanel
    id="survey-editor"
    :ui="{ body: 'sm:p-0' }"
  >
    <template #header>
      <UDashboardNavbar :title="pageTitle">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            v-if="currentSurveyId"
            icon="i-lucide-eye"
            label="Preview"
            color="neutral"
            variant="outline"
            @click="openPreview"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div
        v-if="currentSurveyId"
        class="space-y-4 p-4"
      >
        <UPageCard
          title="Survey Details"
          description="Edit the basic information about this survey."
          variant="subtle"
        >
          <UFormField label="Survey Title">
            <UInput
              v-model="surveyTitle"
              placeholder="Enter survey title..."
              @blur="updateSurveyTitle"
            />
          </UFormField>
        </UPageCard>

        <UPageCard
          title="Survey Category"
          description="The category determines when this survey will be used in the recruitment process."
          variant="subtle"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-muted">Category</span>
            <span class="text-sm font-semibold text-highlighted">{{ getCategoryLabel(selectedCategory) }}</span>
          </div>
          <template #footer>
            <p class="text-xs text-muted">
              Category cannot be changed after survey creation.
            </p>
          </template>
        </UPageCard>

        <UPageCard
          title="Assigned Procedure"
          description="This survey is assigned to the following procedure."
          variant="subtle"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-muted">Procedure</span>
            <span v-if="assignedProcedure" class="text-sm font-semibold text-highlighted">{{ assignedProcedure.title }}</span>
            <span v-else class="text-sm italic text-muted">Not assigned to any procedure</span>
          </div>
          <template v-if="assignedProcedure" #footer>
            <UButton
              icon="i-lucide-external-link"
              label="View Procedure"
              size="xs"
              color="neutral"
              variant="ghost"
              @click="navigateTo(`/admin/procedures/${assignedProcedure.id}/settings`)"
            />
          </template>
        </UPageCard>
      </div>

      <SurveyCreatorComponent :model="creator" />
    </template>
  </UDashboardPanel>
</template>

<script lang="ts" setup>
import 'survey-core/survey-core.css'
import 'survey-creator-core/survey-creator-core.css'

import type { ICreatorOptions } from 'survey-creator-core'
import { SurveyCreatorModel } from 'survey-creator-core'
import { SurveyCreatorComponent } from 'survey-creator-vue'

definePageMeta({
  layout: 'admin',
})

const route = useRoute()
const toast = useToast()
const surveyId = computed(() => route.params.id === 'new' ? null : Number(route.params.id))

// Fetch exam categories codelist
const { data: examCategoriesCodelist } = await useFetch('/api/exam-categories/codelist', {
  default: () => [],
})

const categoryOptions = computed(() => {
  return examCategoriesCodelist.value.map((category: any) => ({
    label: category.label,
    value: category.value,
  }))
})

function getCategoryLabel(value: string): string {
  const item = examCategoriesCodelist.value.find((c: any) => c.value === value)
  return item?.label || value
}

const selectedCategory = ref<string>('')
const assignedProcedure = ref<{ id: number, title: string } | null>(null)
const surveyTitle = ref<string>('')

const creatorOptions: ICreatorOptions = {
  autoSaveEnabled: true,
  collapseOnDrag: true,
}
const creator = new SurveyCreatorModel(creatorOptions)

const currentSurveyId = ref<number | null>(surveyId.value)
const pageTitle = computed(() =>
  currentSurveyId.value ? 'Edit Survey' : 'Create New Survey',
)

// Load existing survey if editing
onMounted(async () => {
  if (surveyId.value) {
    try {
      const survey = await $fetch(`/api/surveys/${surveyId.value}`)
      currentSurveyId.value = survey.id
      selectedCategory.value = survey.category
      surveyTitle.value = survey.title
      creator.JSON = survey.jsonData

      // Set assigned procedure if it exists
      if (survey.procedureSurvey?.procedure) {
        assignedProcedure.value = survey.procedureSurvey.procedure
      }
    }
    catch (error) {
      console.error('Failed to load survey:', error)
      navigateTo('/admin')
    }
  }
})

// Update survey title in creator and backend
async function updateSurveyTitle() {
  if (!currentSurveyId.value || !surveyTitle.value.trim()) return

  // Update creator JSON title
  const json = creator.JSON
  json.title = surveyTitle.value
  creator.JSON = json

  // Save to backend
  try {
    await $fetch(`/api/surveys/${currentSurveyId.value}`, {
      method: 'PUT',
      body: {
        title: surveyTitle.value,
        jsonData: creator.JSON,
        category: selectedCategory.value,
      },
    })
    toast.add({
      title: 'Title updated',
      color: 'success',
    })
  }
  catch (error) {
    console.error('Failed to update title:', error)
    toast.add({
      title: 'Update failed',
      description: 'Failed to update survey title.',
      color: 'error',
    })
  }
}

// Save survey to backend
creator.saveSurveyFunc = async (saveNo: number, callback: (saveNo: number, success: boolean) => void) => {
  // Validate category is selected
  if (!selectedCategory.value) {
    toast.add({
      title: 'Category required',
      description: 'Please select a category before saving.',
      color: 'error',
    })
    callback(saveNo, false)
    return
  }

  // Sync title from input field if it exists, otherwise use creator JSON title
  const titleToUse = surveyTitle.value || creator.JSON.title || 'Untitled Survey'
  surveyTitle.value = titleToUse

  // Update creator JSON title to match
  const json = creator.JSON
  json.title = titleToUse
  creator.JSON = json

  try {
    const surveyData = {
      jsonData: creator.JSON,
      title: titleToUse,
      category: selectedCategory.value,
    }

    if (currentSurveyId.value) {
      // Update existing survey
      await $fetch(`/api/surveys/${currentSurveyId.value}`, {
        method: 'PUT',
        body: surveyData,
      })
    }
    else {
      // Create new survey
      const newSurvey = await $fetch('/api/surveys', {
        method: 'POST',
        body: surveyData,
      })
      if (newSurvey?.id) {
        currentSurveyId.value = newSurvey.id
        // Update URL to reflect the new survey ID
        navigateTo(`/admin/surveys/${newSurvey.id}`, { replace: true })
      }
    }

    callback(saveNo, true)
  }
  catch (error) {
    console.error('Failed to save survey:', error)
    toast.add({
      title: 'Save failed',
      description: 'Failed to save survey. Please try again.',
      color: 'error',
    })
    callback(saveNo, false)
  }
}

const openPreview = () => {
  // Switch to the preview tab in Survey Creator
  creator.activeTab = 'test'
}
</script>

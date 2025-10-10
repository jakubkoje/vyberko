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
const surveyId = computed(() => route.params.id === 'new' ? null : Number(route.params.id))

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
      creator.JSON = survey.jsonData
    }
    catch (error) {
      console.error('Failed to load survey:', error)
      navigateTo('/admin')
    }
  }
})

// Save survey to backend
creator.saveSurveyFunc = async (saveNo: number, callback: (saveNo: number, success: boolean) => void) => {
  try {
    const surveyData = {
      jsonData: creator.JSON,
      title: creator.JSON.title || 'Untitled Survey',
      organizationId: 1,
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
    callback(saveNo, false)
  }
}

const openPreview = () => {
  // Switch to the preview tab in Survey Creator
  creator.activeTab = 'test'
}
</script>

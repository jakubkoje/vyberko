<template>
  <div ref="creatorContainer" class="survey-creator-wrapper" />
</template>

<script setup lang="ts">
import { SurveyCreatorModel } from 'survey-creator-core'
import 'survey-core/defaultV2.min.css'
import 'survey-creator-core/survey-creator-core.min.css'

interface Props {
  json?: any
}

const props = withDefaults(defineProps<Props>(), {
  json: () => ({})
})

const emit = defineEmits<{
  change: [json: any]
  save: [json: any]
}>()

const creatorContainer = ref<HTMLElement>()
const creator = ref<SurveyCreatorModel>()

onMounted(() => {
  if (!creatorContainer.value) return

  const options = {
    showLogicTab: true,
    showTranslationTab: false,
    showJSONEditorTab: false,
    showEmbeddedSurveyTab: false,
    showTestSurveyTab: false,
    isAutoSave: true
  }

  creator.value = new SurveyCreatorModel(options)
  
  // Set initial JSON
  if (props.json && Object.keys(props.json).length > 0) {
    creator.value.JSON = props.json
  }

  // Listen for changes
  creator.value.onModified.add(() => {
    if (creator.value) {
      emit('change', creator.value.JSON)
    }
  })

  // Auto-save functionality
  creator.value.saveSurveyFunc = (saveNo: number, callback: (no: number, success: boolean) => void) => {
    if (creator.value) {
      emit('save', creator.value.JSON)
      callback(saveNo, true)
    }
  }

  // Render the creator
  creator.value.render(creatorContainer.value)
})

// Expose creator instance
defineExpose({
  creator
})
</script>

<style scoped>
.survey-creator-wrapper {
  min-height: 600px;
}

:deep(.svc-creator) {
  border-radius: 0.5rem;
  overflow: hidden;
}

:deep(.svc-creator__banner) {
  display: none;
}
</style>


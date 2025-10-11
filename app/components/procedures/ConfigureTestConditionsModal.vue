<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as v from 'valibot'

const props = defineProps<{
  procedureSurveyId: number
  surveyTitle: string
  currentConditions?: {
    timeLimit?: number | null
    totalPoints?: number | null
    passingScore?: number | null
  }
}>()

const emit = defineEmits<{
  close: [{
    submitted: boolean
    data?: {
      timeLimit?: number | null
      totalPoints?: number | null
      passingScore?: number | null
    }
  }]
}>()

const form = useTemplateRef('form')

// Valibot validation schema
const schema = v.object({
  timeLimit: v.optional(v.nullable(v.pipe(
    v.number(),
    v.minValue(1, 'Time limit must be at least 1 minute'),
  ))),
  totalPoints: v.optional(v.nullable(v.pipe(
    v.number(),
    v.minValue(1, 'Total points must be at least 1'),
  ))),
  passingScore: v.optional(v.nullable(v.pipe(
    v.number(),
    v.minValue(0, 'Passing score cannot be negative'),
  ))),
})

type Schema = v.InferOutput<typeof schema>

// Form state
const state = reactive<Partial<Schema>>({
  timeLimit: props.currentConditions?.timeLimit || null,
  totalPoints: props.currentConditions?.totalPoints || null,
  passingScore: props.currentConditions?.passingScore || null,
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  // Emit the form data to parent component
  emit('close', {
    submitted: true,
    data: event.data,
  })
}

function onCancel() {
  emit('close', { submitted: false })
}
</script>

<template>
  <UModal
    :ui="{ footer: 'justify-end' }"
    :close="{ onClick: onCancel }"
    :title="`Configure Test Conditions: ${surveyTitle}`"
  >
    <template #body>
      <UForm
        ref="form"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Time Limit (minutes)"
          name="timeLimit"
          description="Maximum time allowed for completing this test"
        >
          <UInput
            v-model.number="state.timeLimit"
            type="number"
            :min="1"
            placeholder="e.g., 60"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Total Points"
          name="totalPoints"
          description="Total points available for this test"
        >
          <UInput
            v-model.number="state.totalPoints"
            type="number"
            :min="1"
            placeholder="e.g., 100"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Passing Score"
          name="passingScore"
          description="Minimum score required to pass"
        >
          <UInput
            v-model.number="state.passingScore"
            type="number"
            :min="0"
            placeholder="e.g., 60"
            class="w-full"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <UButton
        color="neutral"
        variant="ghost"
        label="Cancel"
        @click="onCancel"
      />
      <UButton
        label="Save Conditions"
        @click="form?.submit()"
      />
    </template>
  </UModal>
</template>

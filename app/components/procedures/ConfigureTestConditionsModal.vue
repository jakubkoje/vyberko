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
    v.minValue(1, 'Časový limit musí byť aspoň 1 minúta'),
  ))),
  totalPoints: v.optional(v.nullable(v.pipe(
    v.number(),
    v.minValue(1, 'Celkový počet bodov musí byť aspoň 1'),
  ))),
  passingScore: v.optional(v.nullable(v.pipe(
    v.number(),
    v.minValue(0, 'Bodová hranica nemôže byť záporná'),
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
    :title="`Nastaviť podmienky testu: ${surveyTitle}`"
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
          label="Časový limit (minúty)"
          name="timeLimit"
          description="Maximálny čas povolený na dokončenie tohto testu"
        >
          <UInput
            v-model.number="state.timeLimit"
            type="number"
            :min="1"
            placeholder="napr. 60"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Celkový počet bodov"
          name="totalPoints"
          description="Celkový počet bodov dostupných za tento test"
        >
          <UInput
            v-model.number="state.totalPoints"
            type="number"
            :min="1"
            placeholder="napr. 100"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Bodová hranica"
          name="passingScore"
          description="Minimálne skóre potrebné na úspešné absolvovanie"
        >
          <UInput
            v-model.number="state.passingScore"
            type="number"
            :min="0"
            placeholder="napr. 60"
            class="w-full"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <UButton
        color="neutral"
        variant="ghost"
        label="Zrušiť"
        @click="onCancel"
      />
      <UButton
        label="Uložiť podmienky"
        @click="form?.submit()"
      />
    </template>
  </UModal>
</template>

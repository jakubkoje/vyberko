<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as v from 'valibot'

const emit = defineEmits<{
  close: [{
    submitted: boolean
    data?: { title: string, category: string }
  }]
}>()

const form = useTemplateRef('form')

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

// Valibot validation schema
const schema = v.object({
  title: v.pipe(
    v.string(),
    v.nonEmpty('Title is required'),
    v.minLength(3, 'Title must be at least 3 characters'),
    v.maxLength(200, 'Title must not exceed 200 characters'),
  ),
  category: v.pipe(
    v.string(),
    v.nonEmpty('Category is required'),
  ),
})

type Schema = v.InferOutput<typeof schema>

// Form state
const state = reactive<Partial<Schema>>({
  title: '',
  category: '',
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
    title="Create Survey"
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
          label="Title"
          name="title"
          required
        >
          <UInput
            v-model="state.title"
            placeholder="Employee Satisfaction Survey"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField
          label="Category"
          name="category"
          description="This determines when the survey will be used in the recruitment process."
          required
        >
          <USelect
            v-model="state.category"
            :items="categoryOptions"
            placeholder="Select category"
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
        label="Create Survey"
        @click="form?.submit()"
      />
    </template>
  </UModal>
</template>

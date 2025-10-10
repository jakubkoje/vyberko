<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as v from 'valibot'

const props = defineProps<{
  organizationId?: number
}>()

const emit = defineEmits<{
  close: [{
    submitted: boolean
    data?: { title: string, description?: string, status: string, organizationId: number }
  }]
}>()

const form = useTemplateRef('form')

// Valibot validation schema
const schema = v.object({
  title: v.pipe(
    v.string(),
    v.nonEmpty('Title is required'),
    v.minLength(3, 'Title must be at least 3 characters'),
    v.maxLength(200, 'Title must not exceed 200 characters'),
  ),
  description: v.optional(v.string()),
  status: v.pipe(
    v.string(),
    v.nonEmpty('Status is required'),
  ),
})

type Schema = v.InferOutput<typeof schema>

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Closed', value: 'closed' },
]

// Form state
const state = reactive<Partial<Schema>>({
  title: '',
  description: '',
  status: 'active',
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  // Emit the form data to parent component
  emit('close', {
    submitted: true,
    data: {
      ...event.data,
      organizationId: props.organizationId || 1,
    },
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
    title="Create Procedure"
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
            placeholder="Senior Software Engineer Position"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField
          label="Description"
          name="description"
        >
          <UTextarea
            v-model="state.description"
            placeholder="Describe the recruitment procedure..."
            class="w-full"
            :rows="4"
          />
        </UFormField>

        <UFormField
          label="Status"
          name="status"
          required
        >
          <USelect
            v-model="state.status"
            :options="statusOptions"
            placeholder="Select status"
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
        label="Create Procedure"
        @click="form?.submit()"
      />
    </template>
  </UModal>
</template>

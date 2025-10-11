<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as v from 'valibot'

defineProps<{
  procedureId?: number
}>()

const emit = defineEmits<{
  close: [{
    submitted: boolean
    data?: { cisIdentifier: string, name: string, email: string, phone?: string, status: string, notes?: string }
  }]
}>()

const form = useTemplateRef('form')

// Valibot validation schema
const schema = v.object({
  cisIdentifier: v.pipe(
    v.string(),
    v.nonEmpty('CIS identifier is required'),
    v.minLength(3, 'CIS identifier must be at least 3 characters'),
    v.maxLength(50, 'CIS identifier must not exceed 50 characters'),
  ),
  name: v.pipe(
    v.string(),
    v.nonEmpty('Name is required'),
    v.minLength(2, 'Name must be at least 2 characters'),
    v.maxLength(100, 'Name must not exceed 100 characters'),
  ),
  email: v.pipe(
    v.string(),
    v.nonEmpty('Email is required'),
    v.email('Please enter a valid email address'),
  ),
  phone: v.optional(v.string()),
  status: v.pipe(
    v.string(),
    v.nonEmpty('Status is required'),
  ),
  notes: v.optional(v.string()),
})

type Schema = v.InferOutput<typeof schema>

const statusOptions = [
  { label: 'Registered', value: 'registered' },
  { label: 'Testing', value: 'testing' },
  { label: 'Passed Written', value: 'passed_written' },
  { label: 'Failed Written', value: 'failed_written' },
  { label: 'Evaluating', value: 'evaluating' },
  { label: 'Passed', value: 'passed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Selected', value: 'selected' },
]

// Form state
const state = reactive<Partial<Schema>>({
  cisIdentifier: '',
  name: '',
  email: '',
  phone: '',
  status: 'registered',
  notes: '',
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
    title="Add Contender"
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
          label="CIS Identifier"
          name="cisIdentifier"
          description="Unique identifier from CIS ŠS system (will be used as login username)"
          required
        >
          <UInput
            v-model="state.cisIdentifier"
            placeholder="e.g., CIS123456"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField
          label="Name"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            placeholder="John Doe"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Email"
          name="email"
          required
        >
          <UInput
            v-model="state.email"
            type="email"
            placeholder="john@example.com"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Phone"
          name="phone"
        >
          <UInput
            v-model="state.phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Status"
          name="status"
          required
        >
          <USelect
            v-model="state.status"
            :items="statusOptions"
            placeholder="Select status"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Notes"
          name="notes"
        >
          <UTextarea
            v-model="state.notes"
            placeholder="Additional notes about the candidate..."
            class="w-full"
            :rows="3"
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
        label="Add Contender"
        @click="form?.submit()"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as v from 'valibot'

const props = defineProps<{
  contender: {
    name: string
    email: string
    phone?: string
    status: string
    notes?: string
  }
}>()

const emit = defineEmits<{
  close: [{
    submitted: boolean
    data?: { name: string, email: string, phone?: string, status: string, notes?: string }
  }]
}>()

const form = useTemplateRef('form')

// Valibot validation schema
const schema = v.object({
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
  { label: 'Pending', value: 'pending' },
  { label: 'Interviewing', value: 'interviewing' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

// Form state initialized with existing contender data
const state = reactive<Partial<Schema>>({
  name: props.contender.name,
  email: props.contender.email,
  phone: props.contender.phone || '',
  status: props.contender.status,
  notes: props.contender.notes || '',
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
    title="Edit Contender"
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
            :options="statusOptions"
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
            placeholder="Additional notes..."
            class="w-full"
            :rows="4"
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
        label="Save Changes"
        @click="form?.submit()"
      />
    </template>
  </UModal>
</template>

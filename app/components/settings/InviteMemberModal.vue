<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as v from 'valibot'

defineProps<{
  organizationId?: number
}>()

const emit = defineEmits<{
  close: [{
    submitted: boolean
    data?: { name: string, email: string, roleId: number }
  }]
}>()

const form = useTemplateRef('form')

// Fetch available roles
const { data: roles } = await useFetch<{ id: number, name: string, description: string | null }[]>('/api/roles', {
  default: () => [],
})

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
  roleId: v.pipe(
    v.number('Please select a role'),
    v.minValue(1, 'Please select a role'),
  ),
})

type Schema = v.InferOutput<typeof schema>

// Form state
const state = reactive<Partial<Schema>>({
  name: '',
  email: '',
  roleId: undefined,
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
    title="Invite Member"
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
          label="Role"
          name="roleId"
          required
        >
          <USelect
            v-model="state.roleId"
            :items="roles.map(r => ({ label: r.name, value: r.id }))"
            placeholder="Select a role"
            value-key="value"
            label-key="label"
            class="w-full"
          />
          {{ roles }}
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
        label="Invite"
        @click="form?.submit()"
      />
    </template>
  </UModal>
</template>

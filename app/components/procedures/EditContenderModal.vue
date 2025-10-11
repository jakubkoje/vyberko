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
    v.nonEmpty('Meno je povinné'),
    v.minLength(2, 'Meno musí mať aspoň 2 znaky'),
    v.maxLength(100, 'Meno nesmie presiahnuť 100 znakov'),
  ),
  email: v.pipe(
    v.string(),
    v.nonEmpty('Email je povinný'),
    v.email('Prosím zadajte platnú emailovú adresu'),
  ),
  phone: v.optional(v.string()),
  status: v.pipe(
    v.string(),
    v.nonEmpty('Stav je povinný'),
  ),
  notes: v.optional(v.string()),
})

type Schema = v.InferOutput<typeof schema>

const statusOptions = [
  { label: 'Čakajúci', value: 'pending' },
  { label: 'Pohovor', value: 'interviewing' },
  { label: 'Schválený', value: 'approved' },
  { label: 'Zamietnutý', value: 'rejected' },
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
    title="Upraviť uchádzača"
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
          label="Meno"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            placeholder="Ján Novák"
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
            placeholder="jan@priklad.sk"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Telefón"
          name="phone"
        >
          <UInput
            v-model="state.phone"
            type="tel"
            placeholder="+421 900 123 456"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Stav"
          name="status"
          required
        >
          <USelect
            v-model="state.status"
            :items="statusOptions"
            placeholder="Vyberte stav"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Poznámky"
          name="notes"
        >
          <UTextarea
            v-model="state.notes"
            placeholder="Dodatočné poznámky..."
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
        label="Zrušiť"
        @click="onCancel"
      />
      <UButton
        label="Uložiť zmeny"
        @click="form?.submit()"
      />
    </template>
  </UModal>
</template>

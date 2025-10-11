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
    v.nonEmpty('Identifikátor je povinný'),
    v.minLength(3, 'Identifikátor musí mať aspoň 3 znaky'),
    v.maxLength(50, 'Identifikátor nesmie presiahnuť 50 znakov'),
  ),
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
  { label: 'Registrovaný', value: 'registered' },
  { label: 'Testovanie', value: 'testing' },
  { label: 'Prešiel písomnou skúškou', value: 'passed_written' },
  { label: 'Neprešiel písomnou skúškou', value: 'failed_written' },
  { label: 'Hodnotenie', value: 'evaluating' },
  { label: 'Úspešný', value: 'passed' },
  { label: 'Neúspešný', value: 'failed' },
  { label: 'Vybraný', value: 'selected' },
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
    title="Pridať uchádzača"
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
          label="Identifikátor"
          name="cisIdentifier"
          description="Jedinečný identifikátor (bude použitý ako prístupový kód na test)"
          required
        >
          <UInput
            v-model="state.cisIdentifier"
            placeholder="napr. UC-2025-0001"
            class="w-full"
            autofocus
          />
        </UFormField>

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
            placeholder="Dodatočné poznámky o uchádzačovi..."
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
        label="Zrušiť"
        @click="onCancel"
      />
      <UButton
        label="Pridať uchádzača"
        @click="form?.submit()"
      />
    </template>
  </UModal>
</template>

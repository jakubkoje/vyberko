<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as v from 'valibot'

defineProps<{
  procedureId?: number
}>()

const emit = defineEmits<{
  close: [{
    submitted: boolean
    data?: { name: string, email: string, roleId: number }
  }]
}>()

const form = useTemplateRef('form')

// Fetch available roles (staff only, excluding candidates and admin)
const { data: roles } = await useFetch<{ id: number, name: string, displayName: string, description: string | null }[]>('/api/roles', {
  default: () => [],
})

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
  roleId: v.pipe(
    v.number('Prosím vyberte rolu'),
    v.minValue(1, 'Prosím vyberte rolu'),
  ),
})

type Schema = v.InferOutput<typeof schema>

// Form state
const state = reactive({
  name: '',
  email: '',
  roleId: undefined as number | undefined,
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  console.log('📋 AssignStaffModal - Submitting data:', event.data)
  console.log('📋 Role ID type:', typeof event.data.roleId, 'Value:', event.data.roleId)

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
    title="Priradiť zamestnanca k výberovému konaniu"
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
          label="Rola"
          name="roleId"
          required
          help="Vyberte rolu pre tohto zamestnanca na tomto výberovom konaní"
        >
          <USelect
            v-model="state.roleId"
            :items="roles.map(r => ({ label: r.displayName, value: r.id }))"
            placeholder="Vyberte rolu..."
            class="w-full"
          />
        </UFormField>

        <UAlert
          color="info"
          variant="subtle"
          icon="i-lucide-mail"
          title="Emailová pozvánka"
          description="Ak tento používateľ ešte nemá účet, dostane emailovú pozvánku na registráciu a overenie účtu."
        />
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
        label="Priradiť zamestnanca"
        @click="form?.submit()"
      />
    </template>
  </UModal>
</template>

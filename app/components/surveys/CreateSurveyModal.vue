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
const { can, isSubjectExpert } = usePermissions()

// Fetch exam categories codelist
const { data: examCategoriesCodelist } = await useFetch('/api/exam-categories/codelist', {
  default: () => [],
})

const categoryOptions = computed(() => {
  // Subject experts (gestor) can ONLY create professional knowledge tests
  if (isSubjectExpert.value || (can('surveys', 'createProfessional') && !can('surveys', 'createAll'))) {
    return examCategoriesCodelist.value
      .filter((category: any) => category.value === 'professional_knowledge')
      .map((category: any) => ({
        label: category.label,
        value: category.value,
      }))
  }

  // Admins can create all types
  return examCategoriesCodelist.value.map((category: any) => ({
    label: category.label,
    value: category.value,
  }))
})

// Valibot validation schema
const schema = v.object({
  title: v.pipe(
    v.string(),
    v.nonEmpty('Názov je povinný'),
    v.minLength(3, 'Názov musí mať aspoň 3 znaky'),
    v.maxLength(200, 'Názov nesmie presiahnuť 200 znakov'),
  ),
  category: v.pipe(
    v.string(),
    v.nonEmpty('Kategória je povinná'),
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
    title="Vytvoriť test"
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
          label="Názov"
          name="title"
          required
        >
          <UInput
            v-model="state.title"
            placeholder="Odborný test"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField
          label="Kategória"
          name="category"
          description="Určuje kedy bude test použitý vo výberovom konaní."
          required
        >
          <USelect
            v-model="state.category"
            :items="categoryOptions"
            placeholder="Vyberte kategóriu"
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
        label="Vytvoriť test"
        @click="form?.submit()"
      />
    </template>
  </UModal>
</template>

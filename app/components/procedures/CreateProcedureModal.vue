<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as v from 'valibot'

const props = defineProps<{
  organizationId?: number
}>()

interface ProcedureFormData {
  title: string
  description?: string
  status: string
  organizationId: number
  procedureType?: string
  organizationalUnit?: string
  civilServiceSector?: string
  positionTitle?: string
  serviceType?: string
  procedureDate?: Date
  numberOfPositions: number
  testTypes?: string[]
  personalCharacteristics?: string[]
}

const emit = defineEmits<{
  close: [{
    submitted: boolean
    data?: ProcedureFormData
  }]
}>()

const form = useTemplateRef('form')
const toast = useToast()

// CISŠS URL state
const cisssUrl = ref('')
const isLoading = ref(false)

// Valibot validation schema
const schema = v.object({
  title: v.pipe(
    v.string(),
    v.nonEmpty('Názov je povinný'),
    v.minLength(3, 'Názov musí mať aspoň 3 znaky'),
    v.maxLength(200, 'Názov nesmie presiahnuť 200 znakov'),
  ),
  description: v.optional(v.string()),
  status: v.pipe(
    v.string(),
    v.nonEmpty('Stav je povinný'),
  ),
  procedureType: v.pipe(
    v.string(),
    v.nonEmpty('Typ výberového konania je povinný'),
  ),
  organizationalUnit: v.pipe(
    v.string(),
    v.nonEmpty('Organizačná jednotka je povinná'),
  ),
  civilServiceSector: v.pipe(
    v.string(),
    v.nonEmpty('Sektor štátnej služby je povinný'),
  ),
  positionTitle: v.pipe(
    v.string(),
    v.nonEmpty('Názov pozície je povinný'),
  ),
  serviceType: v.pipe(
    v.string(),
    v.nonEmpty('Typ služby je povinný'),
  ),
  procedureDate: v.pipe(
    v.any(),
    v.transform((val) => val ? new Date(val) : undefined),
  ),
  numberOfPositions: v.pipe(
    v.number(),
    v.minValue(1, 'Počet miest musí byť aspoň 1'),
  ),
})

type Schema = v.InferOutput<typeof schema>

const statusOptions = [
  { label: 'Aktívne', value: 'active' },
  { label: 'Koncept', value: 'draft' },
  { label: 'Uzavreté', value: 'closed' },
]

const procedureTypeOptions = [
  { label: 'Širšie vnútorné výberové konanie', value: 'sirsie_vnutorne' },
  { label: 'Vnútorné výberové konanie', value: 'vnutorne' },
  { label: 'Vonkajšie výberové konanie', value: 'vonkajsie' },
]

const serviceTypeOptions = [
  { label: 'Stála štátna služba', value: 'stala' },
  { label: 'Dočasná štátna služba', value: 'docasna' },
]

// Form state
const state = reactive<Partial<Schema> & { testTypes?: string[], personalCharacteristics?: string[] }>({
  title: '',
  description: '',
  status: 'draft',
  procedureType: '',
  organizationalUnit: '',
  civilServiceSector: '',
  positionTitle: '',
  serviceType: '',
  procedureDate: undefined,
  numberOfPositions: 1,
  testTypes: [],
  personalCharacteristics: [],
})

async function loadFromCisss() {
  if (!cisssUrl.value) {
    toast.add({
      title: 'URL je povinné',
      description: 'Prosím zadajte URL z CISŠS',
      color: 'red',
    })
    return
  }

  isLoading.value = true

  try {
    const response = await $fetch('/api/procedures/parse-cisss', {
      method: 'POST',
      body: { url: cisssUrl.value },
    })

    // Prefill form with parsed data
    state.title = response.title || ''
    state.procedureType = response.procedureType || ''
    state.organizationalUnit = response.organizationalUnit || ''
    state.civilServiceSector = response.civilServiceSector || ''
    state.positionTitle = response.positionTitle || ''
    state.serviceType = response.serviceType || ''
    state.numberOfPositions = response.numberOfPositions || 1
    state.testTypes = response.testTypes || []
    state.personalCharacteristics = response.personalCharacteristics || []

    toast.add({
      title: 'Úspech',
      description: 'Formulár bol predvyplnený dátami z CISŠS',
      color: 'green',
    })
  }
  catch (error) {
    console.error('Error loading from CISŠS:', error)
    toast.add({
      title: 'Chyba',
      description: 'Nepodarilo sa načítať dáta z CISŠS URL',
      color: 'red',
    })
  }
  finally {
    isLoading.value = false
  }
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  // Emit the form data to parent component
  emit('close', {
    submitted: true,
    data: {
      ...event.data,
      organizationId: props.organizationId || 1,
      testTypes: state.testTypes,
      personalCharacteristics: state.personalCharacteristics,
    },
  })
}

function onCancel() {
  emit('close', { submitted: false })
}
</script>

<template>
  <UModal
    :ui="{ footer: 'justify-end', body: 'max-h-[70vh] overflow-y-auto' }"
    :close="{ onClick: onCancel }"
    title="Vytvoriť výberové konanie"
  >
    <template #body>
      <!-- CISŠS URL Section -->
      <div class="space-y-3 mb-6 p-4 bg-muted/30 rounded-lg border border-border">
        <div class="text-sm font-semibold text-foreground">Importovať z CISŠS</div>
        <div class="flex gap-2">
          <UInput
            v-model="cisssUrl"
            placeholder="Vložte URL z CISŠS (napr. https://cisss.gov.sk/vyberove-konania/detail/...)"
            class="flex-1"
          />
          <UButton
            label="Načítať"
            :loading="isLoading"
            :disabled="!cisssUrl || isLoading"
            @click="loadFromCisss"
          />
        </div>
      </div>

      <UForm
        ref="form"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="space-y-4">
          <div class="text-sm font-semibold text-foreground">Základné informácie</div>

          <UFormField
            label="Názov"
            name="title"
            required
          >
            <UInput
              v-model="state.title"
              placeholder="napr. Pozícia hlavného štátneho radcu"
              class="w-full"
              autofocus
            />
          </UFormField>

          <UFormField
            label="Popis"
            name="description"
          >
            <UTextarea
              v-model="state.description"
              placeholder="Opíšte výberové konanie..."
              class="w-full"
              :rows="3"
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
        </div>

        <UDivider />

        <div class="space-y-4">
          <div class="text-sm font-semibold text-foreground">Hlavička výberového konania</div>

          <UFormField
            label="Typ výberového konania"
            name="procedureType"
            required
          >
            <USelect
              v-model="state.procedureType"
              :items="procedureTypeOptions"
              placeholder="Vyberte typ výberového konania"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Organizačná jednotka"
            name="organizationalUnit"
            required
          >
            <UInput
              v-model="state.organizationalUnit"
              placeholder="napr. odbor implementácie OKP"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Sektor štátnej služby"
            name="civilServiceSector"
            required
          >
            <UInput
              v-model="state.civilServiceSector"
              placeholder="napr. 1.03 – Medzinárodná spolupráca"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Názov pozície"
            name="positionTitle"
            required
          >
            <UInput
              v-model="state.positionTitle"
              placeholder="napr. hlavný štátny radca"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Typ služby"
            name="serviceType"
            required
          >
            <USelect
              v-model="state.serviceType"
              :items="serviceTypeOptions"
              placeholder="Vyberte typ služby"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Dátum konania"
            name="procedureDate"
          >
            <UInput
              v-model="state.procedureDate"
              type="datetime-local"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Počet miest"
            name="numberOfPositions"
            required
          >
            <UInput
              v-model.number="state.numberOfPositions"
              type="number"
              :min="1"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Test Types and Personal Characteristics -->
        <div v-if="(state.testTypes && state.testTypes.length > 0) || (state.personalCharacteristics && state.personalCharacteristics.length > 0)" class="space-y-4">
          <UDivider />
          <div class="text-sm font-semibold text-foreground">Importované kategórie testov</div>

          <div v-if="state.testTypes && state.testTypes.length > 0" class="space-y-2">
            <div class="text-sm text-muted-foreground">Kategórie písomného testu:</div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(type, index) in state.testTypes"
                :key="index"
                class="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md"
              >
                {{ type }}
              </span>
            </div>
          </div>

          <div v-if="state.personalCharacteristics && state.personalCharacteristics.length > 0" class="space-y-2">
            <div class="text-sm text-muted-foreground">Kategórie ústnej skúšky (osobnostné vlastnosti):</div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(char, index) in state.personalCharacteristics"
                :key="index"
                class="px-2 py-1 text-xs bg-secondary/10 text-secondary rounded-md"
              >
                {{ char }}
              </span>
            </div>
          </div>
        </div>
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
        label="Vytvoriť výberové konanie"
        @click="form?.submit()"
      />
    </template>
  </UModal>
</template>

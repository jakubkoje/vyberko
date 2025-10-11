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

// CISSS URL state
const cisssUrl = ref('')
const isLoading = ref(false)

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
  procedureType: v.pipe(
    v.string(),
    v.nonEmpty('Procedure type is required'),
  ),
  organizationalUnit: v.pipe(
    v.string(),
    v.nonEmpty('Organizational unit is required'),
  ),
  civilServiceSector: v.pipe(
    v.string(),
    v.nonEmpty('Civil service sector is required'),
  ),
  positionTitle: v.pipe(
    v.string(),
    v.nonEmpty('Position title is required'),
  ),
  serviceType: v.pipe(
    v.string(),
    v.nonEmpty('Service type is required'),
  ),
  procedureDate: v.pipe(
    v.any(),
    v.transform((val) => val ? new Date(val) : undefined),
  ),
  numberOfPositions: v.pipe(
    v.number(),
    v.minValue(1, 'Number of positions must be at least 1'),
  ),
})

type Schema = v.InferOutput<typeof schema>

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Closed', value: 'closed' },
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
      title: 'URL Required',
      description: 'Please enter a CISSS URL',
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
      title: 'Success',
      description: 'Form prefilled with CISSS data',
      color: 'green',
    })
  }
  catch (error) {
    console.error('Error loading from CISSS:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to load data from CISSS URL',
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
    title="Create Procedure"
  >
    <template #body>
      <!-- CISSS URL Section -->
      <div class="space-y-3 mb-6 p-4 bg-muted/30 rounded-lg border border-border">
        <div class="text-sm font-semibold text-foreground">Import from CISSS</div>
        <div class="flex gap-2">
          <UInput
            v-model="cisssUrl"
            placeholder="Paste CISSS URL (e.g., https://cisss.gov.sk/vyberove-konania/detail/...)"
            class="flex-1"
          />
          <UButton
            label="Load"
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
          <div class="text-sm font-semibold text-foreground">Basic Information</div>

          <UFormField
            label="Title"
            name="title"
            required
          >
            <UInput
              v-model="state.title"
              placeholder="e.g., Senior Software Engineer Position"
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
              :rows="3"
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
        </div>

        <UDivider />

        <div class="space-y-4">
          <div class="text-sm font-semibold text-foreground">Procedure Header Information</div>

          <UFormField
            label="Procedure Type"
            name="procedureType"
            required
          >
            <USelect
              v-model="state.procedureType"
              :items="procedureTypeOptions"
              placeholder="Select procedure type"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Organizational Unit"
            name="organizationalUnit"
            required
          >
            <UInput
              v-model="state.organizationalUnit"
              placeholder="e.g., odbor implementácie OKP"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Civil Service Sector"
            name="civilServiceSector"
            required
          >
            <UInput
              v-model="state.civilServiceSector"
              placeholder="e.g., 1.03 – Medzinárodná spolupráca"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Position Title"
            name="positionTitle"
            required
          >
            <UInput
              v-model="state.positionTitle"
              placeholder="e.g., hlavný štátny radca"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Service Type"
            name="serviceType"
            required
          >
            <USelect
              v-model="state.serviceType"
              :items="serviceTypeOptions"
              placeholder="Select service type"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Procedure Date"
            name="procedureDate"
          >
            <UInput
              v-model="state.procedureDate"
              type="datetime-local"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Number of Positions"
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
          <div class="text-sm font-semibold text-foreground">Imported Test Categories</div>

          <div v-if="state.testTypes && state.testTypes.length > 0" class="space-y-2">
            <div class="text-sm text-muted-foreground">Written Test Categories:</div>
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
            <div class="text-sm text-muted-foreground">Oral Exam Categories (Personal Characteristics):</div>
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

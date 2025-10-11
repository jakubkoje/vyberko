<script setup lang="ts">
import { UInputMenu } from '#components'
import { LazyProceduresAssignStaffModal, LazyProceduresConfigureTestConditionsModal } from '#components'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const overlay = useOverlay()
const { can } = usePermissions()

const procedureId = computed(() => Number(route.params.id))

const { data: procedure, refresh } = await useFetch(`/api/procedures/${procedureId.value}`)
const { data: staffAssignments, refresh: refreshStaffAssignments } = await useFetch(`/api/procedures/${procedureId.value}/assignments`, {
  default: () => [],
})
const { data: examCriteria, refresh: refreshCriteria } = await useFetch(`/api/procedures/${procedureId.value}/exam-criteria`, {
  default: () => [],
})
const { data: criteriaCodelist } = await useFetch('/api/exam-criteria/codelist', {
  default: () => [],
})
const { data: surveys } = await useFetch('/api/surveys', {
  default: () => [],
})
const { data: procedureSurveys, refresh: refreshProcedureSurveys } = await useFetch(`/api/procedures/${procedureId.value}/surveys`, {
  default: () => [],
})
const { data: examCategoriesCodelist } = await useFetch('/api/exam-categories/codelist', {
  default: () => [],
})

const isEditing = ref(false)
const editState = reactive({
  title: procedure.value?.title || '',
  description: procedure.value?.description || '',
  status: procedure.value?.status || 'active',
  procedureType: procedure.value?.procedureType || '',
  organizationalUnit: procedure.value?.organizationalUnit || '',
  civilServiceSector: procedure.value?.civilServiceSector || '',
  positionTitle: procedure.value?.positionTitle || '',
  serviceType: procedure.value?.serviceType || '',
  procedureDate: procedure.value?.procedureDate || null,
  numberOfPositions: procedure.value?.numberOfPositions || 1,
})

const statusOptions = [
  { label: 'Koncept', value: 'draft' },
  { label: 'Aktívne', value: 'active' },
  { label: 'Testovanie', value: 'testing' },
  { label: 'Hodnotenie', value: 'evaluating' },
  { label: 'Dokončené', value: 'completed' },
  { label: 'Zrušené', value: 'cancelled' },
]

function startEditing() {
  editState.title = procedure.value?.title || ''
  editState.description = procedure.value?.description || ''
  editState.status = procedure.value?.status || 'active'
  editState.procedureType = procedure.value?.procedureType || ''
  editState.organizationalUnit = procedure.value?.organizationalUnit || ''
  editState.civilServiceSector = procedure.value?.civilServiceSector || ''
  editState.positionTitle = procedure.value?.positionTitle || ''
  editState.serviceType = procedure.value?.serviceType || ''
  editState.procedureDate = procedure.value?.procedureDate || null
  editState.numberOfPositions = procedure.value?.numberOfPositions || 1
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
}

async function saveChanges() {
  try {
    await $fetch(`/api/procedures/${procedureId.value}`, {
      method: 'PUT',
      body: editState,
    })

    toast.add({
      title: 'Zmeny uložené',
      description: 'Nastavenia výberového konania boli aktualizované.',
      color: 'success',
    })

    await refresh()
    isEditing.value = false
  }
  catch (error) {
    toast.add({
      title: 'Nepodarilo sa uložiť zmeny',
      description: (error as { data?: { message?: string } })?.data?.message || 'Vyskytla sa chyba',
      color: 'error',
    })
  }
}

async function deleteProcedure() {
  if (!confirm(`Naozaj chcete odstrániť "${procedure.value?.title}"? Táto akcia sa nedá vrátiť späť a odstráni všetkých priradených uchádzačov.`)) {
    return
  }

  try {
    await $fetch(`/api/procedures/${procedureId.value}`, {
      method: 'DELETE',
    })

    toast.add({
      title: 'Výberové konanie odstránené',
      description: 'Výberové konanie bolo natrvalo odstránené.',
      color: 'success',
    })

    router.push('/admin/procedures')
  }
  catch (error) {
    toast.add({
      title: 'Nepodarilo sa odstrániť výberové konanie',
      description: (error as { data?: { message?: string } })?.data?.message || 'Vyskytla sa chyba',
      color: 'error',
    })
  }
}

// Exam Criteria Management
const selectedCriteriaValues = ref<string[]>([])

// Get available options (exclude already selected)
const availableOptions = computed(() => {
  const selectedNames = new Set(examCriteria.value.map((c: any) => c.name))
  return criteriaCodelist.value.filter((option: any) => !selectedNames.has(option.value))
})

// Get label for a criteria value
function getCriteriaLabel(value: string): string {
  const item = criteriaCodelist.value.find((c: any) => c.value === value)
  return item?.label || value
}

async function addSelectedCriteria() {
  if (selectedCriteriaValues.value.length === 0) {
    return
  }

  try {
    await $fetch(`/api/procedures/${procedureId.value}/exam-criteria`, {
      method: 'POST',
      body: {
        names: selectedCriteriaValues.value,
      },
    })

    toast.add({
      title: 'Kritériá pridané',
      description: `Pridané ${selectedCriteriaValues.value.length} kritériá`,
      color: 'success',
    })

    selectedCriteriaValues.value = []
    await refreshCriteria()
  }
  catch (error) {
    toast.add({
      title: 'Nepodarilo sa pridať kritériá',
      description: (error as { data?: { message?: string } })?.data?.message || 'Vyskytla sa chyba',
      color: 'error',
    })
  }
}

async function removeCriteria(criteriaId: number, criteriaName: string) {
  if (!confirm(`Odstrániť "${getCriteriaLabel(criteriaName)}" z kritérií skúšky? Toto vymaže aj všetky súvisiace hodnotenia.`)) {
    return
  }

  try {
    await $fetch(`/api/exam-criteria/${criteriaId}`, {
      method: 'DELETE',
    })

    toast.add({
      title: 'Kritérium odstránené',
      color: 'success',
    })

    await refreshCriteria()
  }
  catch (error) {
    toast.add({
      title: 'Nepodarilo sa odstrániť kritérium',
      description: (error as { data?: { message?: string } })?.data?.message || 'Vyskytla sa chyba',
      color: 'error',
    })
  }
}

// Survey Management
const selectedSurveyIds = ref<number[]>([])

// Get available surveys (not already assigned to this procedure)
const availableSurveys = computed(() => {
  const assignedSurveyIds = new Set(procedureSurveys.value.map((ps: any) => ps.surveyId))
  return surveys.value
    .filter((survey: any) => !assignedSurveyIds.has(survey.id))
    .map((survey: any) => ({
      label: `${survey.title} (${getCategoryLabel(survey.category)})`,
      value: survey.id,
    }))
})

// Get label for a category value
function getCategoryLabel(value: string): string {
  const item = examCategoriesCodelist.value.find((c: any) => c.value === value)
  return item?.label || value
}

// Group surveys by category
const surveysByCategory = computed(() => {
  const grouped: Record<string, any[]> = {}

  // Sort categories by order from codelist
  const sortedCategories = [...examCategoriesCodelist.value].sort((a: any, b: any) => a.order - b.order)

  sortedCategories.forEach((category: any) => {
    grouped[category.value] = procedureSurveys.value
      .filter((ps: any) => ps.category === category.value)
      .sort((a: any, b: any) => a.order - b.order)
  })

  return grouped
})

async function addSelectedSurveys() {
  if (selectedSurveyIds.value.length === 0) {
    return
  }

  try {
    // Add surveys one by one
    await Promise.all(
      selectedSurveyIds.value.map(surveyId =>
        $fetch(`/api/procedures/${procedureId.value}/surveys`, {
          method: 'POST',
          body: {
            surveyId,
          },
        }),
      ),
    )

    toast.add({
      title: 'Testy pridané',
      description: `Pridaných ${selectedSurveyIds.value.length} testov`,
      color: 'success',
    })

    selectedSurveyIds.value = []
    await refreshProcedureSurveys()
  }
  catch (error) {
    toast.add({
      title: 'Nepodarilo sa pridať testy',
      description: (error as { data?: { message?: string } })?.data?.message || 'Vyskytla sa chyba',
      color: 'error',
    })
  }
}

async function removeSurveyFromProcedure(procedureSurveyId: number, surveyTitle: string) {
  if (!confirm(`Odstrániť "${surveyTitle}" z tohto výberového konania?`)) {
    return
  }

  try {
    await $fetch(`/api/procedure-surveys/${procedureSurveyId}`, {
      method: 'DELETE',
    })

    toast.add({
      title: 'Test odstránený',
      color: 'success',
    })

    await refreshProcedureSurveys()
  }
  catch (error) {
    toast.add({
      title: 'Nepodarilo sa odstrániť test',
      description: (error as { data?: { message?: string } })?.data?.message || 'Vyskytla sa chyba',
      color: 'error',
    })
  }
}

// Staff Assignment Management
const staffModal = overlay.create(LazyProceduresAssignStaffModal)
const testConditionsModal = overlay.create(LazyProceduresConfigureTestConditionsModal)

async function openAssignStaffModal() {
  const instance = staffModal.open({
    procedureId: procedureId.value,
  })

  const result: {
    submitted: boolean
    data?: { name: string, email: string, roleId: number }
  } = await instance.result

  if (result.submitted && result.data) {
    try {
      await $fetch(`/api/procedures/${procedureId.value}/assignments`, {
        method: 'POST',
        body: result.data,
      })

      toast.add({
        title: 'Zamestnanec úspešne priradený',
        color: 'success',
      })

      refreshStaffAssignments()
    }
    catch (error) {
      toast.add({
        title: 'Nepodarilo sa priradiť zamestnanca',
        description: (error as { data?: { message?: string } })?.data?.message || 'Vyskytla sa chyba',
        color: 'error',
      })
    }
  }
}

async function openTestConditionsModal(procedureSurvey: any) {
  const instance = testConditionsModal.open({
    procedureSurveyId: procedureSurvey.id,
    surveyTitle: procedureSurvey.surveyTitle,
    currentConditions: {
      timeLimit: procedureSurvey.timeLimit,
      totalPoints: procedureSurvey.totalPoints,
      passingScore: procedureSurvey.passingScore,
    },
  })

  const result: {
    submitted: boolean
    data?: {
      timeLimit?: number | null
      totalPoints?: number | null
      passingScore?: number | null
    }
  } = await instance.result

  if (result.submitted && result.data) {
    try {
      await $fetch(`/api/procedure-surveys/${procedureSurvey.id}`, {
        method: 'PUT',
        body: result.data,
      })

      toast.add({
        title: 'Podmienky testu aktualizované',
        color: 'success',
      })

      refreshProcedureSurveys()
    }
    catch (error) {
      toast.add({
        title: 'Nepodarilo sa aktualizovať podmienky testu',
        description: (error as { data?: { message?: string } })?.data?.message || 'Vyskytla sa chyba',
        color: 'error',
      })
    }
  }
}

async function removeStaffAssignment(assignmentId: number, userName: string) {
  if (!confirm(`Odstrániť ${userName} z tohto výberového konania?`)) {
    return
  }

  try {
    await $fetch(`/api/procedure-assignments/${assignmentId}`, {
      method: 'DELETE',
    })

    toast.add({
      title: 'Zamestnanec odstránený',
      color: 'success',
    })

    await refreshStaffAssignments()
  }
  catch (error) {
    toast.add({
      title: 'Nepodarilo sa odstrániť zamestnanca',
      description: (error as { data?: { message?: string } })?.data?.message || 'Vyskytla sa chyba',
      color: 'error',
    })
  }
}

// Evaluate and submit
const isSubmitting = ref(false)

async function evaluateAndSubmit() {
  if (!confirm('Naozaj chcete vyhodnotiť a uzavrieť toto výberové konanie? Po uzavretí nebude možné ho upravovať.')) {
    return
  }

  isSubmitting.value = true

  try {
    await $fetch(`/api/procedures/${procedureId.value}/finalize`, {
      method: 'POST',
    })

    toast.add({
      title: 'Výberové konanie uzavreté',
      description: 'Výsledky boli vyhodnotené a výberové konanie bolo úspešne uzavreté.',
      color: 'success',
    })

    await refresh()
  }
  catch (error) {
    toast.add({
      title: 'Nepodarilo sa uzavrieť výberové konanie',
      description: (error as { data?: { message?: string } })?.data?.message || 'Vyskytla sa chyba',
      color: 'error',
    })
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- General Settings -->
    <UPageCard
      title="Všeobecné nastavenia"
      description="Spravujte základné informácie o tomto výberovom konaní."
    >
      <template v-if="!isEditing">
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt class="text-sm font-medium text-muted mb-1">
                Identifikátor
              </dt>
              <dd class="text-sm text-highlighted font-mono">
                {{ procedure?.identifier }}
              </dd>
            </div>

            <div>
              <dt class="text-sm font-medium text-muted mb-1">
                Stav
              </dt>
              <dd class="text-sm">
                <UBadge
                  :label="statusOptions.find(o => o.value === procedure?.status)?.label || procedure?.status"
                  :color="procedure?.status === 'active' ? 'success' : procedure?.status === 'draft' ? 'warning' : 'error'"
                  variant="subtle"
                />
              </dd>
            </div>
          </div>

          <div>
            <dt class="text-sm font-medium text-muted mb-1">
              Názov
            </dt>
            <dd class="text-sm text-highlighted">
              {{ procedure?.title }}
            </dd>
          </div>

          <div v-if="procedure?.description">
            <dt class="text-sm font-medium text-muted mb-1">
              Popis
            </dt>
            <dd class="text-sm text-highlighted whitespace-pre-wrap">
              {{ procedure.description }}
            </dd>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-default">
            <div>
              <dt class="text-sm font-medium text-muted mb-1">
                Druh výberového konania
              </dt>
              <dd class="text-sm text-highlighted">
                {{ procedure?.procedureType || 'Nezadané' }}
              </dd>
            </div>

            <div>
              <dt class="text-sm font-medium text-muted mb-1">
                Druh štátnej služby
              </dt>
              <dd class="text-sm text-highlighted">
                {{ procedure?.serviceType || 'Nezadané' }}
              </dd>
            </div>

            <div>
              <dt class="text-sm font-medium text-muted mb-1">
                Odbor štátnej služby
              </dt>
              <dd class="text-sm text-highlighted">
                {{ procedure?.civilServiceSector || 'Nezadané' }}
              </dd>
            </div>

            <div>
              <dt class="text-sm font-medium text-muted mb-1">
                Zaradenie v organizačnej štruktúre
              </dt>
              <dd class="text-sm text-highlighted">
                {{ procedure?.organizationalUnit || 'Nezadané' }}
              </dd>
            </div>

            <div>
              <dt class="text-sm font-medium text-muted mb-1">
                Obsadzovaná funkcia
              </dt>
              <dd class="text-sm text-highlighted">
                {{ procedure?.positionTitle || 'Nezadané' }}
              </dd>
            </div>

            <div>
              <dt class="text-sm font-medium text-muted mb-1">
                Počet obsadzovaných miest
              </dt>
              <dd class="text-sm text-highlighted">
                {{ procedure?.numberOfPositions || 1 }}
              </dd>
            </div>

            <div>
              <dt class="text-sm font-medium text-muted mb-1">
                Dátum konania
              </dt>
              <dd class="text-sm text-highlighted">
                {{ procedure?.procedureDate ? new Date(procedure.procedureDate).toLocaleDateString('sk-SK') : 'Nezadané' }}
              </dd>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="space-y-4">
          <UFormField
            label="Názov"
            required
          >
            <UInput
              v-model="editState.title"
              placeholder="Zadajte názov výberového konania"
            />
          </UFormField>

          <UFormField label="Popis">
            <UTextarea
              v-model="editState.description"
              placeholder="Zadajte popis výberového konania..."
              :rows="4"
            />
          </UFormField>

          <UFormField
            label="Stav"
            required
          >
            <USelect
              v-model="editState.status"
              :items="statusOptions"
            />
          </UFormField>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-default">
            <UFormField
              label="Druh výberového konania"
              required
            >
              <UInput
                v-model="editState.procedureType"
                placeholder="napr. širšie vnútorné VK"
              />
            </UFormField>

            <UFormField
              label="Druh štátnej služby"
              required
            >
              <UInput
                v-model="editState.serviceType"
                placeholder="napr. stála štátna služba"
              />
            </UFormField>

            <UFormField
              label="Odbor štátnej služby"
              required
            >
              <UInput
                v-model="editState.civilServiceSector"
                placeholder="napr. 1.03 – Medzinárodná spolupráca"
              />
            </UFormField>

            <UFormField
              label="Zaradenie v organizačnej štruktúre"
              required
            >
              <UInput
                v-model="editState.organizationalUnit"
                placeholder="napr. odbor implementácie OKP"
              />
            </UFormField>

            <UFormField
              label="Obsadzovaná funkcia"
              required
            >
              <UInput
                v-model="editState.positionTitle"
                placeholder="napr. hlavný štátny radca"
              />
            </UFormField>

            <UFormField
              label="Počet obsadzovaných miest"
              required
            >
              <UInput
                v-model.number="editState.numberOfPositions"
                type="number"
                min="1"
              />
            </UFormField>

            <UFormField label="Dátum konania">
              <UInput
                v-model="editState.procedureDate"
                type="date"
              />
            </UFormField>
          </div>
        </div>
      </template>
      <template
        v-if="!isEditing && can('procedures', 'update')"
        #footer
      >
        <UButton
          label="Upraviť"
          color="neutral"
          @click="startEditing"
        />
      </template>
      <template
        v-else
        #footer
      >
        <div class="flex gap-2">
          <UButton
            label="Zrušiť"
            color="neutral"
            variant="ghost"
            @click="cancelEditing"
          />
          <UButton
            label="Uložiť zmeny"
            @click="saveChanges"
          />
        </div>
      </template>
    </UPageCard>

    <!-- Staff Assignments -->
    <UPageCard
      title="Priradení zamestnanci"
      description="Priraďte zamestnancov k výberovému konaniu. Len priradení zamestnanci môžu hodnotiť uchádzačov."
    >
      <div class="space-y-4">
        <!-- Currently Assigned Staff -->
        <div
          v-if="staffAssignments && staffAssignments.length > 0"
          class="space-y-2"
        >
          <div
            v-for="assignment in staffAssignments"
            :key="assignment.id"
            class="flex items-center justify-between p-3 rounded-md border border-default"
          >
            <div class="flex items-center gap-3">
              <UAvatar
                :src="assignment.userAvatar"
                :alt="assignment.userName"
                size="md"
              />
              <div>
                <p class="text-sm font-medium text-highlighted">
                  {{ assignment.userName }}
                </p>
                <p class="text-xs text-muted">
                  {{ assignment.userEmail }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UBadge
                :label="assignment.roleDisplayName"
                variant="subtle"
                color="primary"
              />
              <UBadge
                :label="assignment.status === 'pending' ? 'Čaká' : 'Aktívny'"
                variant="subtle"
                :color="assignment.status === 'pending' ? 'warning' : 'success'"
                :icon="assignment.status === 'pending' ? 'i-lucide-clock' : 'i-lucide-check-circle'"
              />
              <UButton
                v-if="can('procedures', 'assignStaff')"
                icon="i-lucide-x"
                color="error"
                variant="ghost"
                size="xs"
                @click="removeStaffAssignment(assignment.id, assignment.userName)"
              />
            </div>
          </div>
        </div>

        <div
          v-else
          class="text-center py-6"
        >
          <UIcon
            name="i-lucide-users"
            class="size-10 text-muted mb-2 mx-auto"
          />
          <p class="text-sm text-muted">
            Zatiaľ nie sú priradení žiadni zamestnanci
          </p>
        </div>

        <UButton
          v-if="can('procedures', 'assignStaff')"
          label="Priradiť zamestnanca"
          icon="i-lucide-user-plus"
          color="neutral"
          @click="openAssignStaffModal"
        />
      </div>
    </UPageCard>

    <!-- Oral Exam Criteria -->
    <UPageCard
      title="Kritériá ústnej skúšky"
      description="Vyberte hodnotiace kategórie pre ústne skúšky. Všetky kritériá používajú stupnicu 1-5."
    >
      <div class="space-y-4">
        <!-- Currently Selected Criteria -->
        <div
          v-if="examCriteria && examCriteria.length > 0"
          class="flex flex-wrap gap-2"
        >
          <UBadge
            v-for="criteria in examCriteria"
            :key="criteria.id"
            :label="getCriteriaLabel(criteria.name)"
            variant="subtle"
            color="primary"
            class="pr-1"
          >
            <template
              v-if="can('evaluation', 'defineAbilities')"
              #trailing
            >
              <UButton
                icon="i-lucide-x"
                color="primary"
                variant="ghost"
                size="2xs"
                @click="removeCriteria(criteria.id, criteria.name)"
              />
            </template>
          </UBadge>
        </div>

        <div
          v-else
          class="text-center py-6"
        >
          <UIcon
            name="i-lucide-clipboard-list"
            class="size-10 text-muted mb-2 mx-auto"
          />
          <p class="text-sm text-muted">
            Zatiaľ nie sú vybrané žiadne kritériá skúšky
          </p>
        </div>

        <!-- Add Criteria Selector -->
        <div
          v-if="availableOptions.length > 0 && can('evaluation', 'defineAbilities')"
          class="space-y-3"
        >
          <UFormField label="Pridať kritériá">
            <UInputMenu
              v-model="selectedCriteriaValues"
              :items="availableOptions"
              multiple
              searchable
              placeholder="Vyberte kritériá na pridanie..."
              value-key="value"
              label-key="label"
            />
          </UFormField>

          <UButton
            label="Pridať vybrané"
            icon="i-lucide-plus"
            color="neutral"
            :disabled="selectedCriteriaValues.length === 0"
            @click="addSelectedCriteria"
          />
        </div>

        <div
          v-else-if="examCriteria && examCriteria.length > 0"
          class="text-sm text-muted"
        >
          Všetky dostupné kritériá boli pridané.
        </div>
      </div>
    </UPageCard>

    <!-- Written Exams & Surveys -->
    <UPageCard
      title="Písomné testy"
      description="Priraďte testy k tomuto výberovému konaniu. Testy sú organizované podľa kategórie a zobrazené v prísnom poradí."
    >
      <div class="space-y-6">
        <!-- Assigned Surveys by Category -->
        <div
          v-if="procedureSurveys && procedureSurveys.length > 0"
          class="space-y-4"
        >
          <div
            v-for="category in examCategoriesCodelist"
            :key="category.value"
          >
            <div
              v-if="surveysByCategory[category.value] && surveysByCategory[category.value].length > 0"
              class="space-y-2"
            >
              <h4 class="text-sm font-medium text-highlighted">
                {{ category.label }}
              </h4>
              <div class="space-y-3">
                <div
                  v-for="procedureSurvey in surveysByCategory[category.value]"
                  :key="procedureSurvey.id"
                  class="flex items-center justify-between p-3 rounded-md border border-default"
                >
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <UBadge
                        :label="procedureSurvey.surveyTitle"
                        variant="subtle"
                        color="primary"
                      />
                    </div>
                    <div class="flex flex-wrap gap-3 text-xs text-muted">
                      <div
                        v-if="procedureSurvey.timeLimit"
                        class="flex items-center gap-1"
                      >
                        <UIcon name="i-lucide-clock" />
                        <span>{{ procedureSurvey.timeLimit }} min</span>
                      </div>
                      <div
                        v-if="procedureSurvey.totalPoints"
                        class="flex items-center gap-1"
                      >
                        <UIcon name="i-lucide-target" />
                        <span>{{ procedureSurvey.totalPoints }} pts</span>
                      </div>
                      <div
                        v-if="procedureSurvey.passingScore"
                        class="flex items-center gap-1"
                      >
                        <UIcon name="i-lucide-check-circle" />
                        <span>Pass: {{ procedureSurvey.passingScore }}</span>
                      </div>
                      <div
                        v-if="!procedureSurvey.timeLimit && !procedureSurvey.totalPoints && !procedureSurvey.passingScore"
                        class="text-muted italic"
                      >
                        Nie sú nakonfigurované podmienky testu
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="can('procedures', 'manageTests')"
                    class="flex items-center gap-1"
                  >
                    <UButton
                      icon="i-lucide-settings"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      @click="openTestConditionsModal(procedureSurvey)"
                    />
                    <UButton
                      icon="i-lucide-x"
                      color="error"
                      variant="ghost"
                      size="xs"
                      @click="removeSurveyFromProcedure(procedureSurvey.id, procedureSurvey.surveyTitle)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="text-center py-6"
        >
          <UIcon
            name="i-lucide-file-question"
            class="size-10 text-muted mb-2 mx-auto"
          />
          <p class="text-sm text-muted">
            Zatiaľ nie sú priradené žiadne testy
          </p>
        </div>

        <!-- Add Survey Form -->
        <div
          v-if="availableSurveys.length > 0 && can('procedures', 'manageTests')"
          class="space-y-3 pt-4 border-t border-default"
        >
          <UFormField label="Pridať testy">
            <UInputMenu
              v-model="selectedSurveyIds"
              :items="availableSurveys"
              multiple
              searchable
              placeholder="Vyberte testy na pridanie..."
              value-key="value"
              label-key="label"
            />
          </UFormField>

          <UButton
            label="Pridať vybrané"
            icon="i-lucide-plus"
            color="neutral"
            :disabled="selectedSurveyIds.length === 0"
            @click="addSelectedSurveys"
          />
        </div>

        <div
          v-else-if="procedureSurveys && procedureSurveys.length > 0"
          class="text-sm text-muted pt-4 border-t border-default"
        >
          Všetky dostupné testy boli priradené.
        </div>
      </div>
    </UPageCard>

    <!-- Evaluate and Submit -->
    <UPageCard
      v-if="can('procedures', 'finalize') && procedure?.status !== 'completed'"
      title="Vyhodnotenie a uzavretie"
      description="Vyhodnotiť výsledky a uzavrieť výberové konanie. Táto akcia je nezvratná."
    >
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-highlighted">
            Vyhodnotiť a odoslať
          </h3>
          <p class="text-sm text-muted mt-1">
            Vyhodnotí všetky testy a ústne skúšky, vypočíta celkové skóre pre každého uchádzača a uzavrie výberové konanie. Po uzavretí nebude možné výberové konanie upravovať.
          </p>
        </div>
        <UButton
          label="Vyhodnotiť a uzavrieť"
          color="primary"
          size="lg"
          :loading="isSubmitting"
          @click="evaluateAndSubmit"
        />
      </div>
    </UPageCard>

    <!-- Danger Zone -->
    <UPageCard
      v-if="can('procedures', 'delete')"
      title="Nebezpečná zóna"
      description="Nezvratné akcie, ktoré natrvalo ovplyvnia toto výberové konanie."
    >
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-highlighted">
            Odstrániť výberové konanie
          </h3>
          <p class="text-sm text-muted">
            Natrvalo odstrániť toto výberové konanie a všetkých jeho uchádzačov. Túto akciu nie je možné vrátiť späť.
          </p>
        </div>
        <UButton
          label="Odstrániť výberové konanie"
          color="error"
          variant="outline"
          @click="deleteProcedure"
        />
      </div>
    </UPageCard>
  </div>
</template>

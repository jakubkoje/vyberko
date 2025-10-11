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
})

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Closed', value: 'closed' },
]

function startEditing() {
  editState.title = procedure.value?.title || ''
  editState.description = procedure.value?.description || ''
  editState.status = procedure.value?.status || 'active'
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
      title: 'Changes saved',
      description: 'Procedure settings have been updated.',
      color: 'success',
    })

    await refresh()
    isEditing.value = false
  }
  catch (error) {
    toast.add({
      title: 'Failed to save changes',
      description: (error as { data?: { message?: string } })?.data?.message || 'An error occurred',
      color: 'error',
    })
  }
}

async function deleteProcedure() {
  if (!confirm(`Are you sure you want to delete "${procedure.value?.title}"? This action cannot be undone and will delete all associated contenders.`)) {
    return
  }

  try {
    await $fetch(`/api/procedures/${procedureId.value}`, {
      method: 'DELETE',
    })

    toast.add({
      title: 'Procedure deleted',
      description: 'The procedure has been permanently deleted.',
      color: 'success',
    })

    router.push('/admin/procedures')
  }
  catch (error) {
    toast.add({
      title: 'Failed to delete procedure',
      description: (error as { data?: { message?: string } })?.data?.message || 'An error occurred',
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
      title: 'Criteria added',
      description: `Added ${selectedCriteriaValues.value.length} criteria`,
      color: 'success',
    })

    selectedCriteriaValues.value = []
    await refreshCriteria()
  }
  catch (error) {
    toast.add({
      title: 'Failed to add criteria',
      description: (error as { data?: { message?: string } })?.data?.message || 'An error occurred',
      color: 'error',
    })
  }
}

async function removeCriteria(criteriaId: number, criteriaName: string) {
  if (!confirm(`Remove "${getCriteriaLabel(criteriaName)}" from exam criteria? This will also delete all associated exam scores.`)) {
    return
  }

  try {
    await $fetch(`/api/exam-criteria/${criteriaId}`, {
      method: 'DELETE',
    })

    toast.add({
      title: 'Criteria removed',
      color: 'success',
    })

    await refreshCriteria()
  }
  catch (error) {
    toast.add({
      title: 'Failed to remove criteria',
      description: (error as { data?: { message?: string } })?.data?.message || 'An error occurred',
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
      title: 'Surveys added',
      description: `Added ${selectedSurveyIds.value.length} survey(s)`,
      color: 'success',
    })

    selectedSurveyIds.value = []
    await refreshProcedureSurveys()
  }
  catch (error) {
    toast.add({
      title: 'Failed to add surveys',
      description: (error as { data?: { message?: string } })?.data?.message || 'An error occurred',
      color: 'error',
    })
  }
}

async function removeSurveyFromProcedure(procedureSurveyId: number, surveyTitle: string) {
  if (!confirm(`Remove "${surveyTitle}" from this procedure?`)) {
    return
  }

  try {
    await $fetch(`/api/procedure-surveys/${procedureSurveyId}`, {
      method: 'DELETE',
    })

    toast.add({
      title: 'Survey removed',
      color: 'success',
    })

    await refreshProcedureSurveys()
  }
  catch (error) {
    toast.add({
      title: 'Failed to remove survey',
      description: (error as { data?: { message?: string } })?.data?.message || 'An error occurred',
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
        title: 'Staff assigned successfully',
        color: 'success',
      })

      refreshStaffAssignments()
    }
    catch (error) {
      toast.add({
        title: 'Failed to assign staff',
        description: (error as { data?: { message?: string } })?.data?.message || 'An error occurred',
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
        title: 'Test conditions updated',
        color: 'success',
      })

      refreshProcedureSurveys()
    }
    catch (error) {
      toast.add({
        title: 'Failed to update test conditions',
        description: (error as { data?: { message?: string } })?.data?.message || 'An error occurred',
        color: 'error',
      })
    }
  }
}

async function removeStaffAssignment(assignmentId: number, userName: string) {
  if (!confirm(`Remove ${userName} from this procedure?`)) {
    return
  }

  try {
    await $fetch(`/api/procedure-assignments/${assignmentId}`, {
      method: 'DELETE',
    })

    toast.add({
      title: 'Staff removed',
      color: 'success',
    })

    await refreshStaffAssignments()
  }
  catch (error) {
    toast.add({
      title: 'Failed to remove staff',
      description: (error as { data?: { message?: string } })?.data?.message || 'An error occurred',
      color: 'error',
    })
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- General Settings -->
    <UPageCard
      title="General Settings"
      description="Manage basic information about this recruitment procedure."
    >
      <template v-if="!isEditing">
        <div class="space-y-4">
          <div>
            <dt class="text-sm font-medium text-muted mb-1">
              Title
            </dt>
            <dd class="text-sm text-highlighted">
              {{ procedure?.title }}
            </dd>
          </div>

          <div v-if="procedure?.description">
            <dt class="text-sm font-medium text-muted mb-1">
              Description
            </dt>
            <dd class="text-sm text-highlighted whitespace-pre-wrap">
              {{ procedure.description }}
            </dd>
          </div>

          <div>
            <dt class="text-sm font-medium text-muted mb-1">
              Status
            </dt>
            <dd class="text-sm">
              <UBadge
                :label="procedure?.status"
                :color="procedure?.status === 'active' ? 'success' : procedure?.status === 'draft' ? 'warning' : 'error'"
                variant="subtle"
                class="capitalize"
              />
            </dd>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="space-y-4">
          <UFormField
            label="Title"
            required
          >
            <UInput
              v-model="editState.title"
              placeholder="Enter procedure title"
            />
          </UFormField>

          <UFormField label="Description">
            <UTextarea
              v-model="editState.description"
              placeholder="Enter a description for this procedure..."
              :rows="4"
            />
          </UFormField>

          <UFormField
            label="Status"
            required
          >
            <USelect
              v-model="editState.status"
              :items="statusOptions"
            />
          </UFormField>
        </div>
      </template>
      <template
        v-if="!isEditing && can('procedures', 'update')"
        #footer
      >
        <UButton
          label="Edit"
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
            label="Cancel"
            color="neutral"
            variant="ghost"
            @click="cancelEditing"
          />
          <UButton
            label="Save Changes"
            @click="saveChanges"
          />
        </div>
      </template>
    </UPageCard>

    <!-- Staff Assignments -->
    <UPageCard
      title="Staff Assignments"
      description="Assign staff members to work on this procedure. Only assigned staff can evaluate candidates."
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
                :label="assignment.status === 'pending' ? 'Pending' : 'Active'"
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
            No staff assigned yet
          </p>
        </div>

        <UButton
          v-if="can('procedures', 'assignStaff')"
          label="Assign Staff"
          icon="i-lucide-user-plus"
          color="neutral"
          @click="openAssignStaffModal"
        />
      </div>
    </UPageCard>

    <!-- Oral Exam Criteria -->
    <UPageCard
      title="Oral Exam Criteria"
      description="Select rating categories for oral exams. All criteria use a 1-5 rating scale."
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
            No exam criteria selected yet
          </p>
        </div>

        <!-- Add Criteria Selector -->
        <div
          v-if="availableOptions.length > 0 && can('evaluation', 'defineAbilities')"
          class="space-y-3"
        >
          <UFormField label="Add Criteria">
            <UInputMenu
              v-model="selectedCriteriaValues"
              :items="availableOptions"
              multiple
              searchable
              placeholder="Select criteria to add..."
              value-key="value"
              label-key="label"
            />
          </UFormField>

          <UButton
            label="Add Selected"
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
          All available criteria have been added.
        </div>
      </div>
    </UPageCard>

    <!-- Written Exams & Surveys -->
    <UPageCard
      title="Written Exams & Surveys"
      description="Assign surveys to this procedure. Surveys are organized by category and displayed in strict order."
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
                        No test conditions configured
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
            No surveys assigned yet
          </p>
        </div>

        <!-- Add Survey Form -->
        <div
          v-if="availableSurveys.length > 0 && can('procedures', 'manageTests')"
          class="space-y-3 pt-4 border-t border-default"
        >
          <UFormField label="Add Surveys">
            <UInputMenu
              v-model="selectedSurveyIds"
              :items="availableSurveys"
              multiple
              searchable
              placeholder="Select surveys to add..."
              value-key="value"
              label-key="label"
            />
          </UFormField>

          <UButton
            label="Add Selected"
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
          All available surveys have been assigned.
        </div>
      </div>
    </UPageCard>

    <!-- Danger Zone -->
    <UPageCard
      v-if="can('procedures', 'delete')"
      title="Danger Zone"
      description="Irreversible actions that permanently affect this procedure."
    >
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-highlighted">
            Delete Procedure
          </h3>
          <p class="text-sm text-muted">
            Permanently delete this procedure and all its contenders. This action cannot be undone.
          </p>
        </div>
        <UButton
          label="Delete Procedure"
          color="error"
          variant="outline"
          @click="deleteProcedure"
        />
      </div>
    </UPageCard>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const toast = useToast()

const procedureId = computed(() => Number(route.params.id))

const { data: procedure, refresh } = await useFetch(`/api/procedures/${procedureId.value}`)

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
              :options="statusOptions"
            />
          </UFormField>
        </div>
      </template>
      <template
        v-if="!isEditing"
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

    <!-- Danger Zone -->
    <UPageCard
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

<script setup lang="ts">
import { DateTime } from 'luxon'
import { LazyProceduresEditContenderModal } from '#components'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const overlay = useOverlay()

const procedureId = computed(() => Number(route.params.id))
const contenderId = computed(() => Number(route.params.contenderId))

const { data: contender, refresh } = await useFetch(`/api/contenders/${contenderId.value}`)
const { data: procedure } = await useFetch(`/api/procedures/${procedureId.value}`)

const statusColors: Record<string, 'primary' | 'success' | 'error' | 'warning'> = {
  pending: 'warning',
  interviewing: 'primary',
  approved: 'success',
  rejected: 'error',
}

const modal = overlay.create(LazyProceduresEditContenderModal)

async function openEditModal() {
  if (!contender.value)
    return

  const instance = modal.open({
    contender: {
      name: contender.value.name,
      email: contender.value.email,
      phone: contender.value.phone || '',
      status: contender.value.status,
      notes: contender.value.notes || '',
    },
  })

  const result: {
    submitted: boolean
    data?: { name: string, email: string, phone?: string, status: string, notes?: string }
  } = await instance.result

  if (result.submitted && result.data) {
    try {
      await $fetch(`/api/contenders/${contenderId.value}`, {
        method: 'PUT',
        body: result.data,
      })

      toast.add({
        title: 'Changes saved',
        description: 'Contender information has been updated.',
        color: 'success',
      })

      await refresh()
    }
    catch (error) {
      toast.add({
        title: 'Failed to save changes',
        description: (error as { data?: { message?: string } })?.data?.message || 'An error occurred',
        color: 'error',
      })
    }
  }
}

async function deleteContender() {
  if (!confirm(`Are you sure you want to delete ${contender.value?.name}?`)) {
    return
  }

  try {
    await $fetch(`/api/contenders/${contenderId.value}`, {
      method: 'DELETE',
    })

    toast.add({
      title: 'Contender deleted',
      description: 'The contender has been removed.',
      color: 'success',
    })

    router.push(`/admin/procedures/${procedureId.value}`)
  }
  catch (error) {
    toast.add({
      title: 'Failed to delete contender',
      description: (error as { data?: { message?: string } })?.data?.message || 'An error occurred',
      color: 'error',
    })
  }
}

const formatDate = (dateString: string | Date) => {
  return DateTime.fromISO(dateString.toString()).toLocaleString(DateTime.DATETIME_FULL)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Card -->
    <UPageCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">
            Profile
          </h3>
          <UButton
            icon="i-lucide-pencil"
            label="Edit"
            color="neutral"
            variant="outline"
            size="xs"
            @click="openEditModal"
          />
        </div>
      </template>

      <div class="flex items-start gap-6">
        <UAvatar
          :text="contender?.name"
          size="xl"
        />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 mb-2">
            <h2 class="text-2xl font-bold text-highlighted">
              {{ contender?.name }}
            </h2>
            <UBadge
              :label="contender?.status"
              :color="statusColors[contender?.status || 'pending'] || 'neutral'"
              variant="subtle"
              class="capitalize"
            />
          </div>
          <p class="text-muted mb-1">
            {{ contender?.email }}
          </p>
          <p
            v-if="contender?.phone"
            class="text-muted"
          >
            {{ contender.phone }}
          </p>
        </div>
      </div>
    </UPageCard>

    <!-- Information Card -->
    <UPageCard
      title="Information"
    >
      <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt class="text-sm font-medium text-muted">
            Procedure
          </dt>
          <dd class="mt-1 text-sm text-highlighted">
            {{ procedure?.title }}
          </dd>
        </div>

        <div>
          <dt class="text-sm font-medium text-muted">
            Status
          </dt>
          <dd class="mt-1">
            <UBadge
              :label="contender?.status"
              :color="statusColors[contender?.status || 'pending'] || 'neutral'"
              variant="subtle"
              class="capitalize"
            />
          </dd>
        </div>

        <div>
          <dt class="text-sm font-medium text-muted">
            Email
          </dt>
          <dd class="mt-1 text-sm text-highlighted">
            {{ contender?.email }}
          </dd>
        </div>

        <div>
          <dt class="text-sm font-medium text-muted">
            Phone
          </dt>
          <dd class="mt-1 text-sm text-highlighted">
            {{ contender?.phone || 'N/A' }}
          </dd>
        </div>

        <div>
          <dt class="text-sm font-medium text-muted">
            Created At
          </dt>
          <dd class="mt-1 text-sm text-highlighted">
            {{ contender?.createdAt ? formatDate(contender.createdAt) : 'N/A' }}
          </dd>
        </div>

        <div>
          <dt class="text-sm font-medium text-muted">
            Last Updated
          </dt>
          <dd class="mt-1 text-sm text-highlighted">
            {{ contender?.updatedAt ? formatDate(contender.updatedAt) : 'N/A' }}
          </dd>
        </div>

        <div
          v-if="contender?.notes"
          class="sm:col-span-2"
        >
          <dt class="text-sm font-medium text-muted">
            Notes
          </dt>
          <dd class="mt-1 text-sm text-highlighted whitespace-pre-wrap">
            {{ contender.notes }}
          </dd>
        </div>
      </dl>
    </UPageCard>

    <!-- Danger Zone -->
    <UPageCard
      title="Danger Zone"
      :ui="{ body: 'space-y-4' }"
    >
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-highlighted">
            Delete Contender
          </h3>
          <p class="text-sm text-muted">
            Permanently remove this contender from the procedure.
          </p>
        </div>
        <UButton
          label="Delete"
          color="error"
          variant="outline"
          @click="deleteContender"
        />
      </div>
    </UPageCard>
  </div>
</template>

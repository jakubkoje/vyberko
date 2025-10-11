<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

interface Contender {
  id: number
  cisIdentifier: string
  name: string
  email: string
  phone: string | null
  status: string
  notes: string | null
  userId: number | null
  procedureId: number
  createdAt: string
  updatedAt: string
}

defineProps<{
  contenders: Contender[]
}>()

const emit = defineEmits<{
  select: [id: number]
}>()

function getItems(contender: Contender): DropdownMenuItem[] {
  return [{
    label: 'View details',
    icon: 'i-lucide-eye',
    onSelect: () => emit('select', contender.id),
  }, {
    label: 'Edit contender',
    icon: 'i-lucide-pencil',
    onSelect: () => console.log('Edit contender:', contender),
  }, {
    type: 'separator',
  }, {
    label: 'Remove contender',
    icon: 'i-lucide-trash',
    color: 'error' as const,
    onSelect: () => console.log('Remove contender:', contender),
  }] satisfies DropdownMenuItem[]
}

const statusColors: Record<string, string> = {
  registered: 'neutral',
  testing: 'primary',
  passed_written: 'success',
  failed_written: 'error',
  evaluating: 'warning',
  passed: 'success',
  failed: 'error',
  selected: 'success',
  // Legacy status values
  pending: 'warning',
  interviewing: 'primary',
  approved: 'success',
  rejected: 'error',
}

const statusLabels: Record<string, string> = {
  registered: 'Registered',
  testing: 'Testing',
  passed_written: 'Passed Written',
  failed_written: 'Failed Written',
  evaluating: 'Evaluating',
  passed: 'Passed',
  failed: 'Failed',
  selected: 'Selected',
  // Legacy status values
  pending: 'Pending',
  interviewing: 'Interviewing',
  approved: 'Approved',
  rejected: 'Rejected',
}
</script>

<template>
  <ul
    v-if="contenders.length > 0"
    role="list"
    class="divide-y divide-default"
  >
    <li
      v-for="contender in contenders"
      :key="contender.id"
      class="flex items-center justify-between gap-3 py-3 px-4 sm:px-6 hover:bg-elevated/50 cursor-pointer transition-colors"
      @click="emit('select', contender.id)"
    >
      <div class="flex items-center gap-3 min-w-0">
        <UAvatar
          :text="contender.name"
          size="md"
        />

        <div class="text-sm min-w-0">
          <p class="text-highlighted font-medium truncate">
            {{ contender.name }}
          </p>
          <p class="text-muted truncate">
            {{ contender.email }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <UBadge
          :label="statusLabels[contender.status] || contender.status"
          :color="statusColors[contender.status] || 'neutral'"
          variant="subtle"
        />

        <UDropdownMenu
          :items="getItems(contender)"
          :content="{ align: 'end' }"
          @click.stop
        >
          <UButton
            icon="i-lucide-ellipsis-vertical"
            color="neutral"
            variant="ghost"
          />
        </UDropdownMenu>
      </div>
    </li>
  </ul>
  <div
    v-else
    class="flex flex-col items-center justify-center py-12 px-4"
  >
    <UIcon
      name="i-lucide-users"
      class="size-12 text-muted mb-4"
    />
    <p class="text-sm text-muted">
      No contenders found
    </p>
  </div>
</template>

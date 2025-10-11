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

const toast = useToast()

async function copyAccessCode(cisIdentifier: string) {
  try {
    await navigator.clipboard.writeText(cisIdentifier)
    toast.add({
      title: 'Skopírované!',
      description: 'Prístupový kód bol skopírovaný do schránky',
      color: 'success',
    })
  }
  catch (error) {
    toast.add({
      title: 'Kopírovanie zlyhalo',
      description: 'Nepodarilo sa skopírovať prístupový kód do schránky',
      color: 'error',
    })
  }
}

function getItems(contender: Contender): DropdownMenuItem[] {
  return [{
    label: 'Zobraziť detaily',
    icon: 'i-lucide-eye',
    onSelect: () => emit('select', contender.id),
  }, {
    label: 'Kopírovať prístupový kód',
    icon: 'i-lucide-copy',
    onSelect: () => copyAccessCode(contender.cisIdentifier),
  }, {
    label: 'Upraviť uchádzača',
    icon: 'i-lucide-pencil',
    onSelect: () => console.log('Edit contender:', contender),
  }, {
    type: 'separator',
  }, {
    label: 'Odstrániť uchádzača',
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
  registered: 'Registrovaný',
  testing: 'Testovanie',
  passed_written: 'Prešiel písomnou skúškou',
  failed_written: 'Neprešiel písomnou skúškou',
  evaluating: 'Hodnotenie',
  passed: 'Úspešný',
  failed: 'Neúspešný',
  selected: 'Vybraný',
  // Legacy status values
  pending: 'Čakajúci',
  interviewing: 'Pohovor',
  approved: 'Schválený',
  rejected: 'Zamietnutý',
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
          <p class="text-xs text-muted font-mono">
            Kód: {{ contender.cisIdentifier }}
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
      Žiadni uchádzači
    </p>
  </div>
</template>

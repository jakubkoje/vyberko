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
        title: 'Zmeny uložené',
        description: 'Informácie o uchádzačovi boli aktualizované.',
        color: 'success',
      })

      await refresh()
    }
    catch (error) {
      toast.add({
        title: 'Nepodarilo sa uložiť zmeny',
        description: (error as { data?: { message?: string } })?.data?.message || 'Vyskytla sa chyba',
        color: 'error',
      })
    }
  }
}

async function deleteContender() {
  if (!confirm(`Naozaj chcete odstrániť ${contender.value?.name}?`)) {
    return
  }

  try {
    await $fetch(`/api/contenders/${contenderId.value}`, {
      method: 'DELETE',
    })

    toast.add({
      title: 'Uchádzač odstránený',
      description: 'Uchádzač bol odstránený.',
      color: 'success',
    })

    router.push(`/admin/procedures/${procedureId.value}`)
  }
  catch (error) {
    toast.add({
      title: 'Nepodarilo sa odstrániť uchádzača',
      description: (error as { data?: { message?: string } })?.data?.message || 'Vyskytla sa chyba',
      color: 'error',
    })
  }
}

const formatDate = (dateString: string | Date) => {
  return DateTime.fromISO(dateString.toString()).toLocaleString(DateTime.DATETIME_FULL)
}

async function copyAccessCode() {
  if (!contender.value?.cisIdentifier)
    return

  try {
    await navigator.clipboard.writeText(contender.value.cisIdentifier)
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
</script>

<template>
  <div class="space-y-6">
    <!-- Header Card -->
    <UPageCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">
            Profil
          </h3>
          <UButton
            icon="i-lucide-pencil"
            label="Upraviť"
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

    <!-- Access Code Card -->
    <UPageCard
      v-if="contender?.cisIdentifier"
      variant="subtle"
    >
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <div class="text-sm font-medium text-muted mb-1">
            Prístupový kód k testu
          </div>
          <div class="flex items-center gap-3">
            <code class="text-lg font-mono font-semibold text-primary bg-primary/10 px-3 py-1 rounded">
              {{ contender.cisIdentifier }}
            </code>
            <UButton
              icon="i-lucide-copy"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="copyAccessCode"
            />
          </div>
          <p class="text-xs text-muted mt-2">
            Zdieľajte tento kód s uchádzačom, aby sa mohol pripojiť na test na adrese: <code class="text-xs">{{ $config.public.baseUrl || 'http://localhost:3000' }}/test?code={{ contender.cisIdentifier }}</code>
          </p>
        </div>
      </div>
    </UPageCard>

    <!-- Information Card -->
    <UPageCard
      title="Informácie"
    >
      <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt class="text-sm font-medium text-muted">
            Identifikátor (prístupový kód)
          </dt>
          <dd class="mt-1 text-sm">
            <code class="font-mono font-semibold text-highlighted bg-elevated px-2 py-0.5 rounded">
              {{ contender?.cisIdentifier || 'N/A' }}
            </code>
          </dd>
        </div>

        <div>
          <dt class="text-sm font-medium text-muted">
            Výberové konanie
          </dt>
          <dd class="mt-1 text-sm text-highlighted">
            {{ procedure?.title }}
          </dd>
        </div>

        <div>
          <dt class="text-sm font-medium text-muted">
            Stav
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
            Telefón
          </dt>
          <dd class="mt-1 text-sm text-highlighted">
            {{ contender?.phone || 'N/A' }}
          </dd>
        </div>

        <div>
          <dt class="text-sm font-medium text-muted">
            Vytvorené
          </dt>
          <dd class="mt-1 text-sm text-highlighted">
            {{ contender?.createdAt ? formatDate(contender.createdAt) : 'N/A' }}
          </dd>
        </div>

        <div>
          <dt class="text-sm font-medium text-muted">
            Posledná aktualizácia
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
            Poznámky
          </dt>
          <dd class="mt-1 text-sm text-highlighted whitespace-pre-wrap">
            {{ contender.notes }}
          </dd>
        </div>
      </dl>
    </UPageCard>

    <!-- Danger Zone -->
    <UPageCard
      title="Nebezpečná zóna"
      :ui="{ body: 'space-y-4' }"
    >
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-highlighted">
            Odstrániť uchádzača
          </h3>
          <p class="text-sm text-muted">
            Natrvalo odstrániť tohto uchádzača z výberového konania.
          </p>
        </div>
        <UButton
          label="Odstrániť"
          color="error"
          variant="outline"
          @click="deleteContender"
        />
      </div>
    </UPageCard>
  </div>
</template>

<script setup lang="ts">
import { LazyProceduresCreateContenderModal } from '#components'

const route = useRoute()
const procedureId = computed(() => Number(route.params.id))

const { data: contenders, refresh } = await useFetch(`/api/procedures/${procedureId.value}/contenders`, {
  default: () => [],
})

const q = ref('')

const filteredContenders = computed(() => {
  return contenders.value.filter((contender) => {
    return contender.name.search(new RegExp(q.value, 'i')) !== -1 || contender.email.search(new RegExp(q.value, 'i')) !== -1
  })
})

const toast = useToast()
const overlay = useOverlay()
const router = useRouter()

const modal = overlay.create(LazyProceduresCreateContenderModal)

async function openCreateModal() {
  const instance = modal.open({
    procedureId: procedureId.value,
  })

  const result: {
    submitted: boolean
    data?: { name: string, email: string, phone?: string, status: string, notes?: string }
  } = await instance.result

  if (result.submitted && result.data) {
    try {
      const response = await $fetch<any>(`/api/procedures/${procedureId.value}/contenders`, {
        method: 'POST',
        body: result.data,
      })

      // Show credentials in toast
      if (response?.credentials) {
        toast.add({
          title: 'Uchádzač bol úspešne pridaný',
          description: `Prihlasovacie údaje:\nPoužívateľské meno: ${response.credentials.username}\nHeslo: ${response.credentials.temporaryPassword}\n\nProsím uložte si tieto údaje a zdieľajte ich s uchádzačom.`,
          color: 'success',
          timeout: 0, // Don't auto-dismiss
          actions: [{
            label: 'Kopírovať údaje',
            click: () => {
              navigator.clipboard.writeText(
                `Používateľské meno: ${response.credentials.username}\nHeslo: ${response.credentials.temporaryPassword}`,
              )
              toast.add({
                title: 'Údaje boli skopírované do schránky',
                color: 'success',
              })
            },
          }],
        })
      }
      else {
        toast.add({
          title: 'Uchádzač bol úspešne pridaný',
          color: 'success',
        })
      }

      refresh()
    }
    catch (error) {
      toast.add({
        title: 'Nepodarilo sa pridať uchádzača',
        description: (error as { data?: { message?: string } })?.data?.message || 'Nastala chyba',
        color: 'error',
      })
    }
  }
}

function openContenderDetail(contenderId: number) {
  router.push(`/admin/procedures/${procedureId.value}/contenders/${contenderId}`)
}
</script>

<template>
  <div>
    <UPageCard
      title="Uchádzači"
      description="Spravujte uchádzačov pre toto výberové konanie."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        label="Pridať uchádzača"
        color="neutral"
        class="w-fit lg:ms-auto"
        @click="openCreateModal"
      />
    </UPageCard>

    <UPageCard
      variant="subtle"
      :ui="{ container: 'p-0 sm:p-0 gap-y-0', wrapper: 'items-stretch', header: 'p-4 mb-0 border-b border-default' }"
    >
      <template #header>
        <UInput
          v-model="q"
          icon="i-lucide-search"
          placeholder="Hľadať uchádzačov"
          autofocus
          class="w-full"
        />
      </template>

      <ProceduresContendersList
        :contenders="filteredContenders"
        @select="openContenderDetail"
      />
    </UPageCard>
  </div>
</template>

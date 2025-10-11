<script setup lang="ts">
import { DateTime } from 'luxon'
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { Row } from '@tanstack/table-core'

const UIcon = resolveComponent('UIcon')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const route = useRoute()
const toast = useToast()
const table = useTemplateRef('table')

const contenderId = computed(() => Number(route.params.contenderId))

const { data: files, status: filesStatus, refresh: refreshFiles } = await useFetch(`/api/contenders/${contenderId.value}/files`, {
  lazy: true,
})

type ContenderFile = NonNullable<typeof files.value>[number]

const formatDate = (dateString: string | Date) => {
  return DateTime.fromISO(dateString.toString()).toLocaleString(DateTime.DATETIME_FULL)
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / (k ** i)) * 100) / 100} ${sizes[i]}`
}

function getFileIcon(fileType: string) {
  if (fileType.includes('pdf')) return 'i-lucide-file-text'
  if (fileType.includes('image')) return 'i-lucide-image'
  if (fileType.includes('word') || fileType.includes('document')) return 'i-lucide-file-text'
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'i-lucide-table'
  return 'i-lucide-file'
}

function getRowItems(row: Row<ContenderFile>) {
  return [
    {
      type: 'label',
      label: 'Akcie',
    },
    {
      label: 'Stiahnuť',
      icon: 'i-lucide-download',
      onSelect() {
        // Use download endpoint which proxies authenticated MinIO request
        window.open(`/api/contender-files/${row.original.id}/download`, '_blank')
      },
    },
    {
      label: 'Otvoriť v SharePoint',
      icon: 'i-lucide-external-link',
      onSelect() {
        toast.add({
          title: 'SharePoint integrácia pripravovaná',
          description: 'Toto otvorí súbor v SharePoint po dokončení integrácie.',
        })
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Odstrániť súbor',
      icon: 'i-lucide-trash',
      color: 'error',
      async onSelect() {
        if (confirm(`Naozaj chcete odstrániť súbor "${row.original.fileName}"?`)) {
          try {
            await $fetch(`/api/contender-files/${row.original.id}`, { method: 'DELETE' })
            await refreshFiles()
            toast.add({
              title: 'Súbor odstránený',
              description: 'Súbor bol úspešne odstránený.',
            })
          }
          catch (error) {
            console.error('Failed to delete file:', error)
            toast.add({
              title: 'Chyba',
              description: 'Nepodarilo sa odstrániť súbor.',
              color: 'error',
            })
          }
        }
      },
    },
  ]
}

const isUploading = ref(false)
const fileInput = ref<HTMLInputElement>()

function openFileDialog() {
  fileInput.value?.click()
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  isUploading.value = true

  try {
    const formData = new FormData()
    formData.append('file', file)

    await $fetch(`/api/contenders/${contenderId.value}/files`, {
      method: 'POST',
      body: formData,
    })

    toast.add({
      title: 'Súbor nahratý',
      description: `${file.name} bol úspešne nahraný.`,
      color: 'success',
    })

    await refreshFiles()

    // Reset file input
    if (target) {
      target.value = ''
    }
  }
  catch (error) {
    console.error('Failed to upload file:', error)
    toast.add({
      title: 'Nahratie zlyhalo',
      description: 'Nepodarilo sa nahrať súbor. Skúste to prosím znova.',
      color: 'error',
    })
  }
  finally {
    isUploading.value = false
  }
}

const columns: TableColumn<ContenderFile>[] = [
  {
    accessorKey: 'fileName',
    header: 'Názov súboru',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UIcon, {
          name: getFileIcon(row.original.fileType),
          class: 'size-4',
        }),
        h('span', { class: 'font-medium' }, row.original.fileName),
      ])
    },
  },
  {
    accessorKey: 'fileSize',
    header: 'Veľkosť',
    cell: ({ row }) => {
      return h('span', { class: 'text-sm text-neutral-500' }, formatFileSize(row.original.fileSize))
    },
  },
  {
    accessorKey: 'uploadedAt',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Nahraté',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      })
    },
    cell: ({ row }) => {
      return h('span', { class: 'text-sm text-neutral-500' }, formatDate(row.original.uploadedAt))
    },
  },
  {
    accessorKey: 'sharepointId',
    header: 'SharePoint ID',
    cell: ({ row }) => {
      return h('span', { class: 'text-sm text-neutral-500 font-mono' }, row.original.sharepointId || 'N/A')
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end',
            },
            items: getRowItems(row),
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto',
            }),
        ),
      )
    },
  },
]

const columnFilters = ref([{
  id: 'fileName',
  value: '',
}])

const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
})
</script>

<template>
  <div class="space-y-6">
    <UPageCard
      title="Odoslané súbory"
      description="Dokumenty a súbory odoslané uchádzačom. Súbory sú uložené v MinIO S3."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        @change="handleFileUpload"
      >
      <UButton
        :label="isUploading ? 'Nahráva sa...' : 'Nahrať súbor'"
        :loading="isUploading"
        :disabled="isUploading"
        color="neutral"
        icon="i-lucide-upload"
        class="w-fit lg:ms-auto"
        @click="openFileDialog"
      />
    </UPageCard>

    <UPageCard
      variant="subtle"
      :ui="{ container: 'p-0 sm:p-0 gap-y-0', wrapper: 'items-stretch', header: 'p-4 mb-0 border-b border-default' }"
    >
      <template #header>
        <UInput
          :model-value="(table?.tableApi?.getColumn('fileName')?.getFilterValue() as string)"
          icon="i-lucide-search"
          placeholder="Hľadať súbory..."
          class="w-full"
          @update:model-value="table?.tableApi?.getColumn('fileName')?.setFilterValue($event)"
        />
      </template>

      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel(),
        }"
        :data="files"
        :columns="columns"
        :loading="filesStatus === 'pending'"
        :empty-state="{
          icon: 'i-lucide-file-x',
          label: 'Žiadne súbory',
          description: 'Zatiaľ neboli odoslané žiadne súbory',
        }"
        :ui="{
          base: 'border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 border-b border-default',
          td: 'border-b border-default',
        }"
      />

      <div
        v-if="files && files.length > 0"
        class="flex items-center justify-between gap-3 border-t border-default p-4"
      >
        <div class="text-sm text-muted">
          Nájdených {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} súborov
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>
      </div>
    </UPageCard>

    <!-- Storage Integration Notice -->
    <UPageCard
      title="Úložisko súborov"
      :ui="{ body: 'space-y-2' }"
    >
      <div class="space-y-4">
        <div>
          <h4 class="text-sm font-medium text-highlighted mb-2">
            MinIO S3 úložisko
          </h4>
          <p class="text-sm text-muted">
            Súbory sú aktuálne uložené v MinIO S3-kompatibilnom objektovom úložisku pre bezpečnú a škálovateľnú správu dokumentov.
          </p>
          <p class="text-sm text-highlighted font-medium mt-2">
            Stav: <span class="text-success">Aktívne</span>
          </p>
        </div>

        <div class="border-t border-default pt-4">
          <h4 class="text-sm font-medium text-highlighted mb-2">
            SharePoint integrácia (Budúcnosť)
          </h4>
          <p class="text-sm text-muted">
            Budúca integrácia s Microsoft SharePoint poskytne dodatočné funkcie:
          </p>
          <ul class="text-sm text-muted list-disc list-inside space-y-1 mt-2">
            <li>Automatická synchronizácia súborov</li>
            <li>Správa verzií a história</li>
            <li>Pokročilé riadenie prístupu</li>
            <li>Spolupráca v reálnom čase</li>
          </ul>
          <p class="text-sm text-highlighted font-medium mt-2">
            Stav: <span class="text-warning">Plánované</span>
          </p>
        </div>
      </div>
    </UPageCard>
  </div>
</template>

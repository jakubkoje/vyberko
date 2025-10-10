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
      label: 'Actions',
    },
    {
      label: 'Download',
      icon: 'i-lucide-download',
      onSelect() {
        window.open(row.original.fileUrl, '_blank')
      },
    },
    {
      label: 'View in SharePoint',
      icon: 'i-lucide-external-link',
      onSelect() {
        toast.add({
          title: 'SharePoint integration coming soon',
          description: 'This will open the file in SharePoint once integration is complete.',
        })
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Delete file',
      icon: 'i-lucide-trash',
      color: 'error',
      async onSelect() {
        if (confirm(`Are you sure you want to delete "${row.original.fileName}"?`)) {
          try {
            await $fetch(`/api/contender-files/${row.original.id}`, { method: 'DELETE' })
            await refreshFiles()
            toast.add({
              title: 'File deleted',
              description: 'The file has been deleted.',
            })
          }
          catch (error) {
            console.error('Failed to delete file:', error)
            toast.add({
              title: 'Error',
              description: 'Failed to delete file.',
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
      title: 'File uploaded',
      description: `${file.name} has been uploaded successfully.`,
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
      title: 'Upload failed',
      description: 'Failed to upload file. Please try again.',
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
    header: 'File Name',
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
    header: 'Size',
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
        label: 'Uploaded',
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
      title="Submitted Files"
      description="Documents and files submitted by the contender. Files are stored in MinIO S3."
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
        :label="isUploading ? 'Uploading...' : 'Upload File'"
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
          placeholder="Search files..."
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
          label: 'No files found',
          description: 'No files have been submitted yet',
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
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} file(s) found.
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
      title="File Storage"
      :ui="{ body: 'space-y-2' }"
    >
      <div class="space-y-4">
        <div>
          <h4 class="text-sm font-medium text-highlighted mb-2">
            MinIO S3 Storage
          </h4>
          <p class="text-sm text-muted">
            Files are currently stored in MinIO S3-compatible object storage for secure and scalable document management.
          </p>
          <p class="text-sm text-highlighted font-medium mt-2">
            Status: <span class="text-success">Active</span>
          </p>
        </div>

        <div class="border-t border-default pt-4">
          <h4 class="text-sm font-medium text-highlighted mb-2">
            SharePoint Integration (Future)
          </h4>
          <p class="text-sm text-muted">
            Future integration with Microsoft SharePoint will provide additional features:
          </p>
          <ul class="text-sm text-muted list-disc list-inside space-y-1 mt-2">
            <li>Automatic file synchronization</li>
            <li>Version control and history</li>
            <li>Advanced access control</li>
            <li>Real-time collaboration</li>
          </ul>
          <p class="text-sm text-highlighted font-medium mt-2">
            Status: <span class="text-warning">Planned</span>
          </p>
        </div>
      </div>
    </UPageCard>
  </div>
</template>

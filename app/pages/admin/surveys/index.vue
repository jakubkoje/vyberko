<template>
  <UDashboardPanel id="surveys">
    <template #header>
      <UDashboardNavbar
        title="Surveys"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UTooltip
            text="Notifications"
            :shortcuts="['N']"
          >
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip
                color="error"
                inset
              >
                <UIcon
                  name="i-lucide-bell"
                  class="size-5 shrink-0"
                />
              </UChip>
            </UButton>
          </UTooltip>

          <UButton
            icon="i-lucide-plus"
            size="md"
            label="Create Survey"
            @click="navigateTo('/admin/surveys/new')"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex items-center justify-between gap-1.5">
        <UInput
          :model-value="(table?.tableApi?.getColumn('title')?.getFilterValue() as string)"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search surveys..."
          @update:model-value="table?.tableApi?.getColumn('title')?.setFilterValue($event)"
        />
      </div>

      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel(),
        }"
        class="shrink-0"
        :data="data"
        :columns="columns"
        :loading="status === 'pending'"
        :empty-state="{
          icon: 'i-lucide-file-question',
          label: 'No surveys found',
          description: 'Create your first survey to get started',
        }"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
        }"
      />

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} survey(s) found.
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
    </template>
  </UDashboardPanel>
</template>

<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import { DateTime } from 'luxon'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { Row } from '@tanstack/table-core'

const UIcon = resolveComponent('UIcon')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

definePageMeta({
  layout: 'admin',
})

const { isNotificationsSlideoverOpen } = useDashboard()
const toast = useToast()
const table = useTemplateRef('table')

interface Survey {
  id: number
  title: string
  jsonData: any
  userId: number | null
  createdAt: string
  updatedAt: string
}

const { data, status, refresh } = await useFetch('/api/surveys', {
  lazy: true,
  query: {
    organizationId: 1,
  },
})

watch(data, () => {
  console.log(data.value)
})

function getRowItems(row: Row<Survey>) {
  return [
    {
      type: 'label',
      label: 'Actions',
    },
    {
      label: 'Edit survey',
      icon: 'i-lucide-pencil',
      onSelect() {
        navigateTo(`/admin/surveys/${row.original.id}`)
      },
    },
    {
      label: 'Preview survey',
      icon: 'i-lucide-eye',
      onSelect() {
        // TODO: Implement preview
        console.log('Preview survey:', row.original)
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Delete survey',
      icon: 'i-lucide-trash',
      color: 'error',
      async onSelect() {
        if (confirm(`Are you sure you want to delete "${row.original.title}"?`)) {
          try {
            await $fetch(`/api/surveys/${row.original.id}`, { method: 'DELETE' })
            await refresh()
            toast.add({
              title: 'Survey deleted',
              description: 'The survey has been deleted.',
            })
          }
          catch (error) {
            console.error('Failed to delete survey:', error)
            toast.add({
              title: 'Error',
              description: 'Failed to delete survey.',
              color: 'error',
            })
          }
        }
      },
    },
  ]
}

const formatDate = (dateString: string) => {
  return DateTime.fromISO(dateString).toLocaleString(DateTime.DATETIME_MED)
}

const columns: TableColumn<Survey>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'title',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Title',
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
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UIcon, {
          name: 'i-lucide-file-text',
          class: 'size-4',
        }),
        h('span', { class: 'font-medium' }, row.original.title),
      ])
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      return h('span', { class: 'text-sm text-neutral-500' }, formatDate(row.original.createdAt))
    },
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Last Updated',
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
      return h('span', { class: 'text-sm text-neutral-500' }, formatDate(row.original.updatedAt))
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
  id: 'title',
  value: '',
}])

const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
})
</script>

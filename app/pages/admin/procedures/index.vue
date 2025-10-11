<template>
  <UDashboardPanel id="procedures">
    <template #header>
      <UDashboardNavbar
        title="Recruitment Procedures"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template
          v-if="can('procedures', 'create')"
          #right
        >
          <UButton
            icon="i-lucide-plus"
            size="md"
            label="New Procedure"
            @click="createProcedure"
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
          placeholder="Search procedures..."
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
          icon: 'i-lucide-briefcase',
          label: 'No procedures found',
          description: 'Create your first recruitment procedure to get started',
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
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} procedure(s) found.
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
import { LazyProceduresCreateProcedureModal } from '#components'

const UIcon = resolveComponent('UIcon')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UBadge = resolveComponent('UBadge')

definePageMeta({
  layout: 'admin',
})

const toast = useToast()
const overlay = useOverlay()
const table = useTemplateRef('table')
const router = useRouter()
const { can } = usePermissions()

interface Procedure {
  id: number
  title: string
  description: string | null
  status: string
  organizationId: number
  createdById: number | null
  createdAt: string
  updatedAt: string
}

const { data, status, refresh } = await useFetch('/api/procedures', {
  lazy: true,
  query: {
    organizationId: 1,
  },
})

const statusColors: Record<string, string> = {
  active: 'success',
  closed: 'error',
  draft: 'warning',
}

function getRowItems(row: Row<Procedure>) {
  return [
    {
      type: 'label',
      label: 'Actions',
    },
    {
      label: 'View details',
      icon: 'i-lucide-eye',
      onSelect() {
        navigateTo(`/admin/procedures/${row.original.id}`)
      },
    },
    {
      label: 'Edit procedure',
      icon: 'i-lucide-pencil',
      onSelect() {
        // TODO: Implement edit modal
        console.log('Edit procedure:', row.original)
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Delete procedure',
      icon: 'i-lucide-trash',
      color: 'error',
      async onSelect() {
        if (confirm(`Are you sure you want to delete "${row.original.title}"?`)) {
          try {
            await $fetch(`/api/procedures/${row.original.id}`, { method: 'DELETE' })
            await refresh()
            toast.add({
              title: 'Procedure deleted',
              description: 'The procedure has been deleted.',
            })
          }
          catch (error) {
            console.error('Failed to delete procedure:', error)
            toast.add({
              title: 'Error',
              description: 'Failed to delete procedure.',
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

const modal = overlay.create(LazyProceduresCreateProcedureModal)

async function createProcedure() {
  const instance = modal.open({
    organizationId: 1,
  })

  const result: {
    submitted: boolean
    data?: { title: string, description?: string, status: string, organizationId: number }
  } = await instance.result

  if (result.submitted && result.data) {
    try {
      const newProcedure = await $fetch('/api/procedures', {
        method: 'POST',
        body: result.data,
      })

      toast.add({
        title: 'Procedure created successfully',
        color: 'success',
      })

      refresh()
      if (newProcedure?.id) {
        router.push(`/admin/procedures/${newProcedure.id}`)
      }
    }
    catch (error) {
      toast.add({
        title: 'Failed to create procedure',
        description: (error as { data?: { message?: string } })?.data?.message || 'An error occurred',
        color: 'error',
      })
    }
  }
}

const columns: TableColumn<Procedure>[] = [
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
          name: 'i-lucide-briefcase',
          class: 'size-4',
        }),
        h('span', { class: 'font-medium' }, row.original.title),
      ])
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      return h(UBadge, {
        label: row.original.status,
        color: statusColors[row.original.status] || 'neutral',
        variant: 'subtle',
      })
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

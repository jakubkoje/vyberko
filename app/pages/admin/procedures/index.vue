<template>
  <UDashboardPanel id="procedures">
    <template #header>
      <UDashboardNavbar
        title="Výberové konania"
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
            icon="i-lucide-download"
            size="md"
            label="Import z CISŠS"
            variant="outline"
            @click="openCisssImport"
          />
          <UButton
            icon="i-lucide-plus"
            size="md"
            label="Nové výberové konanie"
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
          placeholder="Hľadať výberové konania..."
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
          label: 'Žiadne výberové konania',
          description: 'Vytvorte vaše prvé výberové konanie',
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
          Nájdených {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} výberových konaní.
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
import { LazyProceduresCreateProcedureModal, LazyProceduresCisssImportModal } from '#components'

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
      label: 'Akcie',
    },
    {
      label: 'Zobraziť detaily',
      icon: 'i-lucide-eye',
      onSelect() {
        navigateTo(`/admin/procedures/${row.original.id}`)
      },
    },
    {
      label: 'Upraviť výberové konanie',
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
      label: 'Odstrániť výberové konanie',
      icon: 'i-lucide-trash',
      color: 'error',
      async onSelect() {
        if (confirm(`Naozaj chcete odstrániť "${row.original.title}"?`)) {
          try {
            await $fetch(`/api/procedures/${row.original.id}`, { method: 'DELETE' })
            await refresh()
            toast.add({
              title: 'Výberové konanie odstránené',
              description: 'Výberové konanie bolo úspešne odstránené.',
            })
          }
          catch (error) {
            console.error('Failed to delete procedure:', error)
            toast.add({
              title: 'Chyba',
              description: 'Nepodarilo sa odstrániť výberové konanie.',
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
const cisssImportModal = overlay.create(LazyProceduresCisssImportModal)

async function openCisssImport() {
  const instance = cisssImportModal.open()

  const result: {
    imported: boolean
    count: number
  } = await instance.result

  if (result.imported) {
    toast.add({
      title: 'Import successful',
      description: `${result.count} procedure(s) imported from CISŠS`,
      color: 'success',
    })

    refresh()
  }
}

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
        title: 'Výberové konanie bolo úspešne vytvorené',
        color: 'success',
      })

      refresh()
      if (newProcedure?.id) {
        router.push(`/admin/procedures/${newProcedure.id}`)
      }
    }
    catch (error) {
      toast.add({
        title: 'Nepodarilo sa vytvoriť výberové konanie',
        description: (error as { data?: { message?: string } })?.data?.message || 'Nastala chyba',
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
        label: 'Názov',
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
    header: 'Stav',
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
    header: 'Vytvorené',
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
        label: 'Posledná aktualizácia',
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

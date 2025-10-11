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

        <template
          v-if="can('surveys', 'create') || can('surveys', 'createAll') || can('surveys', 'createProfessional')"
          #right
        >
          <UButton
            icon="i-lucide-plus"
            size="md"
            label="Create Survey"
            @click="createSurvey"
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
import { LazySurveysCreateSurveyModal } from '#components'

const UIcon = resolveComponent('UIcon')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

definePageMeta({
  layout: 'admin',
})

const toast = useToast()
const overlay = useOverlay()
const table = useTemplateRef('table')
const router = useRouter()
const { can } = usePermissions()

const { data, status, refresh } = await useFetch('/api/surveys', {
  lazy: true,
})

const { data: examCategoriesCodelist } = await useFetch('/api/exam-categories/codelist', {
  default: () => [],
})

type Survey = NonNullable<typeof data.value>[number]

watch(data, () => {
  console.log(data.value)
})

function getCategoryLabel(value: string): string {
  const item = examCategoriesCodelist.value.find((c: any) => c.value === value)
  return item?.label || value
}

const modal = overlay.create(LazySurveysCreateSurveyModal)

async function createSurvey() {
  const instance = modal.open()

  const result: {
    submitted: boolean
    data?: { title: string, category: string }
  } = await instance.result

  if (result.submitted && result.data) {
    try {
      const newSurvey = await $fetch('/api/surveys', {
        method: 'POST',
        body: {
          ...result.data,
          jsonData: {
            title: result.data.title,
            pages: [],
          },
        },
      })

      toast.add({
        title: 'Survey created successfully',
        color: 'success',
      })

      refresh()
      if (newSurvey?.id) {
        router.push(`/admin/surveys/${newSurvey.id}`)
      }
    }
    catch (error) {
      toast.add({
        title: 'Failed to create survey',
        description: (error as { data?: { message?: string } })?.data?.message || 'An error occurred',
        color: 'error',
      })
    }
  }
}

function getRowItems(row: Row<Survey>) {
  const items: any[] = [
    {
      type: 'label',
      label: 'Actions',
    },
  ]

  // Edit - admin and gestor can edit
  if (can('surveys', 'update')) {
    items.push({
      label: 'Edit survey',
      icon: 'i-lucide-pencil',
      onSelect() {
        navigateTo(`/admin/surveys/${row.original.id}`)
      },
    })
  }

  // Preview - everyone can preview
  items.push({
    label: 'Preview survey',
    icon: 'i-lucide-eye',
    onSelect() {
      // TODO: Implement preview
      console.log('Preview survey:', row.original)
    },
  })

  // Duplicate - admin and gestor can duplicate
  if (can('surveys', 'duplicate')) {
    items.push({
      label: 'Duplicate survey',
      icon: 'i-lucide-copy',
      async onSelect() {
        try {
          const newSurvey = await $fetch('/api/surveys', {
            method: 'POST',
            body: {
              jsonData: row.original.jsonData,
              title: `${row.original.title} (Copy)`,
              category: row.original.category,
            },
          })
          await refresh()
          toast.add({
            title: 'Survey duplicated',
            description: 'The survey has been duplicated.',
            color: 'success',
          })
          navigateTo(`/admin/surveys/${newSurvey.id}`)
        }
        catch (error) {
          console.error('Failed to duplicate survey:', error)
          toast.add({
            title: 'Error',
            description: 'Failed to duplicate survey.',
            color: 'error',
          })
        }
      },
    })
  }

  // Submit for Approval - gestor can submit draft/rejected surveys
  if (row.original.status === 'draft' || row.original.status === 'rejected') {
    items.push({
      type: 'separator',
    })
    items.push({
      label: 'Submit for Approval',
      icon: 'i-lucide-send',
      async onSelect() {
        try {
          await $fetch(`/api/surveys/${row.original.id}/submit-for-approval`, { method: 'POST' })
          await refresh()
          toast.add({
            title: 'Survey submitted for approval',
            color: 'success',
          })
        }
        catch (error) {
          console.error('Failed to submit survey:', error)
          toast.add({
            title: 'Error',
            description: 'Failed to submit survey for approval.',
            color: 'error',
          })
        }
      },
    })
  }

  // Approve - admin can approve pending surveys
  if (can('surveys', 'approve') && row.original.status === 'pending_approval') {
    items.push({
      type: 'separator',
    })
    items.push({
      label: 'Approve Survey',
      icon: 'i-lucide-check-circle',
      color: 'success',
      async onSelect() {
        try {
          await $fetch(`/api/surveys/${row.original.id}/approve`, { method: 'POST' })
          await refresh()
          toast.add({
            title: 'Survey approved',
            color: 'success',
          })
        }
        catch (error) {
          console.error('Failed to approve survey:', error)
          toast.add({
            title: 'Error',
            description: 'Failed to approve survey.',
            color: 'error',
          })
        }
      },
    })
    items.push({
      label: 'Reject Survey',
      icon: 'i-lucide-x-circle',
      color: 'error',
      async onSelect() {
        const reason = prompt('Please provide a reason for rejection:')
        if (!reason) return

        try {
          await $fetch(`/api/surveys/${row.original.id}/reject`, {
            method: 'POST',
            body: { rejectionReason: reason },
          })
          await refresh()
          toast.add({
            title: 'Survey rejected',
            color: 'warning',
          })
        }
        catch (error) {
          console.error('Failed to reject survey:', error)
          toast.add({
            title: 'Error',
            description: 'Failed to reject survey.',
            color: 'error',
          })
        }
      },
    })
  }

  // Delete - only admin can delete
  if (can('surveys', 'delete')) {
    items.push({
      type: 'separator',
    })
    items.push({
      label: 'Delete survey',
      icon: 'i-lucide-trash',
      color: 'error',
      async onSelect() {
        if (confirm(`Are you sure you want to delete "${row.original.title}"?`)) {
          try{
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
    })
  }

  return items
}

const formatDate = (dateString: string | Date) => {
  return DateTime.fromISO(dateString.toString()).toLocaleString(DateTime.DATETIME_MED)
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
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => {
      return h('span', { class: 'text-sm' }, getCategoryLabel(row.original.category))
    },
  },
  {
    accessorKey: 'procedure',
    header: 'Procedure',
    cell: ({ row }) => {
      const procedure = row.original.procedureSurvey?.procedure
      if (!procedure) {
        return h('span', { class: 'text-sm text-muted italic' }, 'Not assigned')
      }
      return h('span', { class: 'text-sm' }, procedure.title)
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const UBadge = resolveComponent('UBadge')
      const statusColors: Record<string, string> = {
        draft: 'neutral',
        pending_approval: 'warning',
        approved: 'success',
        rejected: 'error',
      }
      const statusLabels: Record<string, string> = {
        draft: 'Draft',
        pending_approval: 'Pending Approval',
        approved: 'Approved',
        rejected: 'Rejected',
      }
      return h(UBadge, {
        label: statusLabels[row.original.status] || row.original.status,
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

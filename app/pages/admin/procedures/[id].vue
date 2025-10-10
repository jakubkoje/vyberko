<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

definePageMeta({
  layout: 'admin',
})

const route = useRoute()
const procedureId = computed(() => Number(route.params.id))

const { data: procedure } = await useFetch(`/api/procedures/${procedureId.value}`)

const links = [[{
  label: 'Dashboard',
  icon: 'i-lucide-layout-dashboard',
  to: `/admin/procedures/${procedureId.value}`,
  exact: true,
}, {
  label: 'Settings',
  icon: 'i-lucide-settings',
  to: `/admin/procedures/${procedureId.value}/settings`,
}]] satisfies NavigationMenuItem[][]
</script>

<template>
  <UDashboardPanel
    id="procedure-detail"
  >
    <template #header>
      <UDashboardNavbar :title="procedure?.title || 'Procedure'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <UNavigationMenu
          :items="links"
          highlight
          class="-mx-1 flex-1"
        />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>

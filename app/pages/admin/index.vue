<script setup lang="ts">
import { DateTime } from 'luxon'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Period, Range } from '~/types'

definePageMeta({
  layout: 'admin',
})

const items = [[{
  label: 'Procedures',
  icon: 'i-lucide-briefcase',
  to: '/admin/procedures',
}, {
  label: 'Surveys',
  icon: 'i-lucide-file-text',
  to: '/admin/surveys',
}]] satisfies DropdownMenuItem[][]
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar
        title="Home"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div>
        <h1 class="text-2xl font-semibold">
          Welcome to the admin dashboard of the platform <span class="text-4xl font-extrabold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Vyberko</span>
        </h1>
        <p class="text-muted">
          Use the sidebar to navigate to the different sections of the platform.
        </p>
      </div>
    </template>
  </UDashboardPanel>
</template>

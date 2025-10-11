<script setup lang="ts">
import { DateTime } from 'luxon'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Period, Range } from '~/types'

definePageMeta({
  layout: 'admin',
})

const items = [[{
  label: 'Výberové konania',
  icon: 'i-lucide-briefcase',
  to: '/admin/procedures',
}, {
  label: 'Testy',
  icon: 'i-lucide-file-text',
  to: '/admin/surveys',
}]] satisfies DropdownMenuItem[][]
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar
        title="Domov"
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
          Vitajte v administrátorskom rozhraní platformy <span class="text-4xl font-extrabold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Vyberko</span>
        </h1>
        <p class="text-muted">
          Použite bočný panel na navigáciu medzi jednotlivými sekciami platformy.
        </p>
      </div>
    </template>
  </UDashboardPanel>
</template>

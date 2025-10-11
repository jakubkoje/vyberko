<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()

const open = ref(false)

const links = [[{
  label: 'Domov',
  icon: 'i-lucide-house',
  to: '/admin',
  onSelect: () => {
    open.value = false
  },
}, {
  label: 'Testy',
  icon: 'i-lucide-file-text',
  to: '/admin/surveys',
  onSelect: () => {
    open.value = false
  },
}, {
  label: 'Výberové konania',
  icon: 'i-lucide-briefcase',
  to: '/admin/procedures',
  onSelect: () => {
    open.value = false
  },
}],
] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Prejsť na',
  items: links.flat(),
},
])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'Používame cookies na zlepšenie vášho zážitku na našej webovej stránke.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Prijať',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      },
    }, {
      label: 'Odmietnuť',
      color: 'neutral',
      variant: 'ghost',
    }],
  })
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default"
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>

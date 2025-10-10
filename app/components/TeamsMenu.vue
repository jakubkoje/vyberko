<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const { user } = useUserSession()

// Fetch user's organizations
const { data: orgData, refresh } = await useFetch('/api/me/organizations')

const organizations = computed(() => {
  return orgData.value?.organizations.map(org => ({
    id: org.id,
    label: org.name,
    avatar: {
      src: `https://api.dicebear.com/7.x/initials/svg?seed=${org.name}`,
      alt: org.name,
    },
  })) || []
})

const selectedOrganization = computed(() => {
  if (orgData.value?.currentOrganization) {
    return {
      id: orgData.value.currentOrganization.id,
      label: orgData.value.currentOrganization.name,
      avatar: {
        src: `https://api.dicebear.com/7.x/initials/svg?seed=${orgData.value.currentOrganization.name}`,
        alt: orgData.value.currentOrganization.name,
      },
    }
  }

  // Fallback to first organization if no current org set
  return organizations.value[0] || {
    label: 'No Organization',
    avatar: {
      src: 'https://api.dicebear.com/7.x/initials/svg?seed=NO',
      alt: 'No Organization',
    },
  }
})

const items = computed<DropdownMenuItem[][]>(() => {
  if (organizations.value.length === 0) {
    return [[{
      label: 'No organizations',
      disabled: true,
    }]]
  }

  return [organizations.value.map(org => ({
    ...org,
    checked: org.id === selectedOrganization.value?.id,
    type: 'checkbox' as const,
    onSelect() {
      // TODO: Implement organization switching
      console.log('Switch to organization:', org.id)
    },
  }))]
})
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-40' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...selectedOrganization,
        label: collapsed ? undefined : selectedOrganization?.label,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down',
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :class="[!collapsed && 'py-2']"
      :ui="{
        trailingIcon: 'text-dimmed',
      }"
    />
  </UDropdownMenu>
</template>

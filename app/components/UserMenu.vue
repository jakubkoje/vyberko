<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode()
const { user: sessionUser, clear } = useUserSession()
const toast = useToast()

const user = computed(() => {
  if (!sessionUser.value) {
    return {
      name: 'Guest',
      avatar: {
        src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
        alt: 'Guest',
      },
    }
  }

  return {
    name: sessionUser.value.name,
    email: sessionUser.value.email,
    role: sessionUser.value.role,
    avatar: {
      src: sessionUser.value.avatar,
      alt: sessionUser.value.name,
    },
  }
})

const roleLabel = computed(() => {
  const roleMap: Record<string, string> = {
    admin: 'Admin',
    subject_expert: 'Subject Expert',
    commission_chair: 'Commission Chair',
    commission_member: 'Commission Member',
    candidate: 'Candidate',
  }
  return sessionUser.value?.role ? roleMap[sessionUser.value.role] : 'Unknown'
})

async function handleLogout() {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clear()
    await navigateTo('/auth/staff-login')
    toast.add({
      title: 'Logged out successfully',
      color: 'green',
    })
  }
  catch (error) {
    toast.add({
      title: 'Logout failed',
      description: 'Please try again',
      color: 'red',
    })
  }
}

const items = computed<DropdownMenuItem[][]>(() => ([[{
  type: 'label',
  label: user.value.name,
  avatar: user.value.avatar,
  description: roleLabel.value,
}], [{
  label: 'Profile',
  icon: 'i-lucide-user',
  to: '/admin/profile',
}], [{
  label: 'Appearance',
  icon: 'i-lucide-sun-moon',
  children: [{
    label: 'Light',
    icon: 'i-lucide-sun',
    type: 'checkbox',
    checked: colorMode.value === 'light',
    onSelect(e: Event) {
      e.preventDefault()
      colorMode.preference = 'light'
    },
  }, {
    label: 'Dark',
    icon: 'i-lucide-moon',
    type: 'checkbox',
    checked: colorMode.value === 'dark',
    onSelect(e: Event) {
      e.preventDefault()
      colorMode.preference = 'dark'
    },
  }],
}], [{
  label: 'Log out',
  icon: 'i-lucide-log-out',
  onSelect: handleLogout,
}]]))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...user,
        label: collapsed ? undefined : user?.name,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down',
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed',
      }"
    />

    <template #chip-leading="{ item }">
      <span
        :style="{
          '--chip-light': `var(--color-${(item as any).chip}-500)`,
          '--chip-dark': `var(--color-${(item as any).chip}-400)`,
        }"
        class="ms-0.5 size-2 rounded-full bg-(--chip-light) dark:bg-(--chip-dark)"
      />
    </template>
  </UDropdownMenu>
</template>

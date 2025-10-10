<script setup lang="ts">
import type { Member } from '~/types'
import { LazySettingsInviteMemberModal } from '#components'

const organizationId = 1

const { data: members, refresh } = await useFetch<Member[]>(`/api/organizations/${organizationId}/members`, {
  default: () => [],
})

const q = ref('')

const filteredMembers = computed(() => {
  return members.value.filter((member) => {
    return member.name.search(new RegExp(q.value, 'i')) !== -1 || member.username.search(new RegExp(q.value, 'i')) !== -1
  })
})

const toast = useToast()
const overlay = useOverlay()

const modal = overlay.create(LazySettingsInviteMemberModal)

async function openInviteModal() {
  const instance = modal.open({
    organizationId,
  })

  const result = await instance.result

  if (result.submitted && result.data) {
    // Make the API call to invite the member
    try {
      await $fetch(`/api/organizations/${organizationId}/members`, {
        method: 'POST',
        body: result.data,
      })

      toast.add({
        title: 'Member invited successfully',
        color: 'success',
      })

      // Refresh the members list
      refresh()
    }
    catch (error: any) {
      toast.add({
        title: 'Failed to invite member',
        description: error?.data?.message || 'An error occurred',
        color: 'error',
      })
    }
  }
}
</script>

<template>
  <div>
    <UPageCard
      title="Members"
      description="Invite new members by email address."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        label="Invite people"
        color="neutral"
        class="w-fit lg:ms-auto"
        @click="openInviteModal"
      />
    </UPageCard>

    <UPageCard
      variant="subtle"
      :ui="{ container: 'p-0 sm:p-0 gap-y-0', wrapper: 'items-stretch', header: 'p-4 mb-0 border-b border-default' }"
    >
      <template #header>
        <UInput
          v-model="q"
          icon="i-lucide-search"
          placeholder="Search members"
          autofocus
          class="w-full"
        />
      </template>

      <SettingsMembersList :members="filteredMembers" />
    </UPageCard>
  </div>
</template>

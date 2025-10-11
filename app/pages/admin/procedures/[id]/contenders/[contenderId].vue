<script setup lang="ts">
const route = useRoute()
const procedureId = computed(() => Number(route.params.id))
const contenderId = computed(() => Number(route.params.contenderId))

const { data: contender } = await useFetch(`/api/contenders/${contenderId.value}`)

const tabs = [{
  label: 'Overview',
  icon: 'i-lucide-user',
  value: 'index',
  to: `/admin/procedures/${procedureId.value}/contenders/${contenderId.value}`,
}, {
  label: 'Test Results',
  icon: 'i-lucide-check-square',
  value: 'test-results',
  to: `/admin/procedures/${procedureId.value}/contenders/${contenderId.value}/test-results`,
}, {
  label: 'Oral Exam',
  icon: 'i-lucide-clipboard-list',
  value: 'oral-exam',
  to: `/admin/procedures/${procedureId.value}/contenders/${contenderId.value}/oral-exam`,
}, {
  label: 'Files',
  icon: 'i-lucide-file-text',
  value: 'files',
  to: `/admin/procedures/${procedureId.value}/contenders/${contenderId.value}/files`,
}]

// Computed property for active tab with getter/setter
const selectedTab = computed({
  get() {
    if (route.path.endsWith('/test-results')) return 'test-results'
    if (route.path.endsWith('/oral-exam')) return 'oral-exam'
    if (route.path.endsWith('/files')) return 'files'
    return 'index'
  },
  set(index: string) {
    navigateTo(tabs.find(tab => tab.value === index)?.to || 'index')
  },
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header with back button -->
    <div class="flex items-center gap-4">
      <UButton
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        @click="navigateTo(`/admin/procedures/${procedureId}`)"
      />
      <h1 class="text-2xl font-bold text-highlighted">
        {{ contender?.name || 'Contender' }}
      </h1>
    </div>

    <!-- Tabs -->
    <UTabs
      v-model="selectedTab"
      :items="tabs"
      :content="false"
    />

    <!-- Tab content -->
    <NuxtPage />
  </div>
</template>

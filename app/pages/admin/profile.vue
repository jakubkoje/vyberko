<script setup lang="ts">
import { DateTime } from 'luxon'

definePageMeta({
  layout: 'admin',
})

const { user } = useUserSession()
const toast = useToast()
const config = useRuntimeConfig()

// Fetch user's assigned procedures
const { data: procedures } = await useFetch('/api/me/procedures', {
  default: () => [],
})

// Active sessions (mock for now - would need session management)
const activeSessions = ref([
  {
    id: 1,
    device: 'Chrome on macOS',
    location: 'Bratislava, Slovakia',
    lastActive: new Date(),
    current: true,
  },
])

function getKeycloakAccountUrl() {
  return `${config.public.oauth?.keycloak?.serverUrl || 'https://keycloak.pucwoll.dev'}/realms/master/account`
}

function terminateSession(sessionId: number) {
  if (activeSessions.value.find(s => s.id === sessionId)?.current) {
    toast.add({
      title: 'Cannot terminate current session',
      description: 'Log out instead to end your current session.',
      color: 'warning',
    })
    return
  }

  toast.add({
    title: 'Session terminated',
    color: 'success',
  })

  activeSessions.value = activeSessions.value.filter(s => s.id !== sessionId)
}
</script>

<template>
  <UDashboardPanel id="profile">
    <template #header>
      <UDashboardNavbar title="Profile">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-6 w-full lg:max-w-2xl mx-auto p-4">
        <!-- Personal Information -->
        <UPageCard
          title="Personal Information"
          description="Your account details managed by Keycloak."
        >
          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <UAvatar
                :src="user?.avatar"
                :alt="user?.name"
                size="xl"
              />
              <div>
                <h3 class="text-lg font-semibold text-highlighted">
                  {{ user?.name }}
                </h3>
                <p class="text-sm text-muted">
                  {{ user?.email }}
                </p>
                <UBadge
                  v-if="user?.role"
                  :label="user.role"
                  variant="subtle"
                  color="primary"
                  class="mt-1"
                />
              </div>
            </div>

            <USeparator />

            <div class="space-y-2">
              <dt class="text-sm font-medium text-muted">
                Authentication Provider
              </dt>
              <dd class="text-sm text-highlighted">
                {{ user?.authProvider === 'keycloak' ? 'Keycloak (SSO)' : 'Local' }}
              </dd>
            </div>
          </div>

          <template #footer>
            <UButton
              label="Manage Account in Keycloak"
              icon="i-lucide-external-link"
              color="neutral"
              :to="getKeycloakAccountUrl()"
              target="_blank"
              trailing
            />
          </template>
        </UPageCard>

        <!-- Assigned Procedures -->
        <UPageCard
          title="My Procedures"
          description="Recruitment procedures you're assigned to."
        >
          <div
            v-if="procedures && procedures.length > 0"
            class="space-y-2"
          >
            <NuxtLink
              v-for="procedure in procedures"
              :key="procedure.procedureId"
              :to="`/admin/procedures/${procedure.procedureId}`"
              class="flex items-center justify-between p-3 rounded-md border border-default hover:bg-muted/50 transition-colors"
            >
              <div>
                <p class="text-sm font-medium text-highlighted">
                  {{ procedure.procedureTitle }}
                </p>
                <p class="text-xs text-muted">
                  {{ procedure.procedureIdentifier }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <UBadge
                  :label="procedure.roleDisplayName"
                  variant="subtle"
                  color="primary"
                />
                <UBadge
                  :label="procedure.status === 'pending' ? 'Pending' : 'Active'"
                  variant="subtle"
                  :color="procedure.status === 'pending' ? 'warning' : 'success'"
                />
              </div>
            </NuxtLink>
          </div>

          <div
            v-else
            class="text-center py-8"
          >
            <UIcon
              name="i-lucide-folder-open"
              class="size-10 text-muted mb-2 mx-auto"
            />
            <p class="text-sm text-muted">
              You haven't been assigned to any procedures yet.
            </p>
          </div>
        </UPageCard>

        <!-- Active Sessions -->
        <UPageCard
          title="Active Sessions"
          description="Manage your active login sessions across devices."
        >
          <div class="space-y-3">
            <div
              v-for="session in activeSessions"
              :key="session.id"
              class="flex items-center justify-between p-3 rounded-md border border-default"
            >
              <div class="flex items-center gap-3">
                <UIcon
                  :name="session.current ? 'i-lucide-monitor' : 'i-lucide-smartphone'"
                  class="size-5 text-muted"
                />
                <div>
                  <p class="text-sm font-medium text-highlighted">
                    {{ session.device }}
                    <UBadge
                      v-if="session.current"
                      label="Current"
                      variant="subtle"
                      color="success"
                      size="xs"
                      class="ml-2"
                    />
                  </p>
                  <p class="text-xs text-muted">
                    {{ session.location }} • Last active {{ DateTime.fromJSDate(session.lastActive).toRelative() }}
                  </p>
                </div>
              </div>
              <UButton
                v-if="!session.current"
                icon="i-lucide-log-out"
                color="error"
                variant="ghost"
                size="xs"
                @click="terminateSession(session.id)"
              />
            </div>
          </div>

          <template #footer>
            <UAlert
              icon="i-lucide-info"
              color="info"
              variant="subtle"
              title="Session Management"
              description="Sessions are managed by Keycloak. For advanced session management, use the Keycloak account page."
            />
          </template>
        </UPageCard>

        <!-- Security Actions -->
        <UPageCard
          title="Security"
          description="Manage your password and two-factor authentication."
        >
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 rounded-md border border-default">
              <div>
                <p class="text-sm font-medium text-highlighted">
                  Change Password
                </p>
                <p class="text-xs text-muted">
                  Update your password in Keycloak
                </p>
              </div>
              <UButton
                label="Change"
                icon="i-lucide-external-link"
                color="neutral"
                size="xs"
                :to="getKeycloakAccountUrl()"
                target="_blank"
                trailing
              />
            </div>

            <div class="flex items-center justify-between p-3 rounded-md border border-default">
              <div>
                <p class="text-sm font-medium text-highlighted">
                  Two-Factor Authentication
                </p>
                <p class="text-xs text-muted">
                  {{ user?.role === 'admin' ? 'Required for admin accounts' : 'Optional for your role' }}
                </p>
              </div>
              <UButton
                label="Configure"
                icon="i-lucide-external-link"
                color="neutral"
                size="xs"
                :to="getKeycloakAccountUrl()"
                target="_blank"
                trailing
              />
            </div>
          </div>
        </UPageCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

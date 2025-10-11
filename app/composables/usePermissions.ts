import type { Permission } from '~/server/utils/permissions'

/**
 * Composable for checking user permissions in UI components
 */
export function usePermissions() {
  const { user } = useUserSession()

  const permissions = computed<Permission>(() => {
    if (!user.value?.role) {
      return {}
    }

    // Import permission logic from server
    return getRolePermissions(user.value.role)
  })

  /**
   * Check if user has a specific permission
   */
  function can(resource: keyof Permission, action: string): boolean {
    if (!permissions.value || !permissions.value[resource]) {
      return false
    }

    const resourcePermissions = permissions.value[resource] as Record<string, boolean>
    return resourcePermissions[action] === true
  }

  /**
   * Check if user cannot do something (opposite of can)
   */
  function cannot(resource: keyof Permission, action: string): boolean {
    return !can(resource, action)
  }

  /**
   * Check if user is a specific role
   */
  function isRole(roleName: string): boolean {
    return user.value?.role === roleName
  }

  /**
   * Check if user is admin
   */
  const isAdmin = computed(() => isRole('admin'))

  /**
   * Check if user is subject expert (gestor)
   */
  const isSubjectExpert = computed(() => isRole('subject_expert'))

  /**
   * Check if user is commission chair
   */
  const isCommissionChair = computed(() => isRole('commission_chair'))

  /**
   * Check if user is commission member
   */
  const isCommissionMember = computed(() => isRole('commission_member'))

  /**
   * Check if user is candidate
   */
  const isCandidate = computed(() => isRole('candidate'))

  /**
   * Check if user is any commission role (chair or member)
   */
  const isCommission = computed(() => isCommissionChair.value || isCommissionMember.value)

  return {
    permissions,
    can,
    cannot,
    isRole,
    isAdmin,
    isSubjectExpert,
    isCommissionChair,
    isCommissionMember,
    isCandidate,
    isCommission,
  }
}

/**
 * Get permissions for a role - client-side version
 * Must match server/utils/permissions.ts
 */
function getRolePermissions(roleName: string): Permission {
  switch (roleName) {
    case 'admin':
      return {
        surveys: { create: true, createAll: true, createProfessional: true, read: true, update: true, duplicate: true, delete: true },
        users: { createStaff: true, createCandidates: true, invite: true, remove: true, updateRole: true },
        procedures: {
          create: true,
          read: true,
          update: true,
          delete: true,
          assignStaff: true,
          manageTests: true,
          viewLiveStats: true,
          evaluateCandidates: true,
          viewResults: true,
          viewTestErrors: true,
          finalizeDocumentation: true,
          importSharePoint: true,
        },
        templates: { create: true, read: true, provide: true },
        storage: { view: true, upload: true, delete: true },
        evaluation: { defineAbilities: true, defineQuestions: true, assignPoints: true, finalize: true },
      }

    case 'subject_expert':
      return {
        surveys: { create: false, createAll: false, createProfessional: true, read: true, update: true, duplicate: true, delete: false },
        users: { createStaff: false, createCandidates: false, invite: false, remove: false, updateRole: false },
        procedures: {
          create: false,
          read: true,
          update: false,
          delete: false,
          assignStaff: false,
          manageTests: false,
          viewLiveStats: false,
          evaluateCandidates: false,
          viewResults: false,
          viewTestErrors: false,
          finalizeDocumentation: false,
          importSharePoint: false,
        },
        templates: { create: false, read: true, provide: false },
        storage: { view: false, upload: false, delete: false },
        evaluation: { defineAbilities: false, defineQuestions: false, assignPoints: false, finalize: false },
      }

    case 'commission_chair':
      return {
        surveys: { create: false, createAll: false, createProfessional: false, read: true, update: false, duplicate: false, delete: false },
        users: { createStaff: false, createCandidates: false, invite: false, remove: false, updateRole: false },
        procedures: {
          create: false,
          read: true,
          update: false,
          delete: false,
          assignStaff: false,
          manageTests: false,
          viewLiveStats: false,
          evaluateCandidates: true,
          viewResults: true,
          viewTestErrors: true,
          finalizeDocumentation: false,
          importSharePoint: false,
        },
        templates: { create: false, read: false, provide: false },
        storage: { view: true, upload: false, delete: false },
        evaluation: { defineAbilities: false, defineQuestions: false, assignPoints: true, finalize: true },
      }

    case 'commission_member':
      return {
        surveys: { create: false, createAll: false, createProfessional: false, read: true, update: false, duplicate: false, delete: false },
        users: { createStaff: false, createCandidates: false, invite: false, remove: false, updateRole: false },
        procedures: {
          create: false,
          read: true,
          update: false,
          delete: false,
          assignStaff: false,
          manageTests: false,
          viewLiveStats: false,
          evaluateCandidates: true,
          viewResults: true,
          viewTestErrors: true,
          finalizeDocumentation: false,
          importSharePoint: false,
        },
        templates: { create: false, read: false, provide: false },
        storage: { view: true, upload: false, delete: false },
        evaluation: { defineAbilities: false, defineQuestions: false, assignPoints: true, finalize: false },
      }

    case 'candidate':
      return {
        surveys: { create: false, createAll: false, createProfessional: false, read: true, update: false, duplicate: false, delete: false },
        users: { createStaff: false, createCandidates: false, invite: false, remove: false, updateRole: false },
        procedures: {
          create: false,
          read: true,
          update: false,
          delete: false,
          assignStaff: false,
          manageTests: false,
          viewLiveStats: false,
          evaluateCandidates: false,
          viewResults: true,
          viewTestErrors: false,
          finalizeDocumentation: false,
          importSharePoint: false,
        },
        templates: { create: false, read: false, provide: false },
        storage: { view: false, upload: false, delete: false },
        evaluation: { defineAbilities: false, defineQuestions: false, assignPoints: false, finalize: false },
      }

    default:
      return {}
  }
}

/**
 * Permission system based on Keycloak roles.
 * Permissions are inferred from role names at runtime, not stored in database.
 */

export interface Permission {
  surveys?: {
    create?: boolean
    createAll?: boolean // Create all types of tests
    createProfessional?: boolean // Only professional knowledge tests (gestor)
    read?: boolean
    update?: boolean
    duplicate?: boolean
    delete?: boolean
  }
  users?: {
    createStaff?: boolean // Create gestor and commission accounts
    createCandidates?: boolean // Create candidate accounts
    invite?: boolean
    remove?: boolean
    updateRole?: boolean
  }
  procedures?: {
    create?: boolean // Create with predefined header
    read?: boolean
    update?: boolean
    delete?: boolean
    assignStaff?: boolean
    manageTests?: boolean // Assign tests, set conditions
    viewLiveStats?: boolean // View candidates count, timer, interim results
    evaluateCandidates?: boolean
    viewResults?: boolean
    viewTestErrors?: boolean // View detailed test errors
    finalize?: boolean // Finalize and close procedure
    finalizeDocumentation?: boolean // Export and send PDF
    importSharePoint?: boolean // Import documents from SharePoint
  }
  templates?: {
    create?: boolean
    read?: boolean
    provide?: boolean // Provide templates to gestor
  }
  storage?: {
    view?: boolean // View candidate documents (CV, certificates, etc)
    upload?: boolean
    delete?: boolean
  }
  evaluation?: {
    defineAbilities?: boolean // Predefine abilities and personality traits
    defineQuestions?: boolean // Select questions from database
    assignPoints?: boolean // Assign points during evaluation
    finalize?: boolean // Finalize evaluation (commission_chair only)
  }
}

/**
 * Get permissions for a role based on role name.
 * This function infers permissions from the role name according to VK requirements.
 */
export function getRolePermissions(roleName: string): Permission {
  switch (roleName) {
    case 'admin':
      // Tajomník VK - Full access to everything
      return {
        surveys: {
          create: true,
          createAll: true,
          createProfessional: true,
          read: true,
          update: true,
          duplicate: true,
          delete: true,
        },
        users: {
          createStaff: true,
          createCandidates: true,
          invite: true,
          remove: true,
          updateRole: true,
        },
        procedures: {
          create: true, // Create with predefined header
          read: true,
          update: true,
          delete: true,
          assignStaff: true,
          manageTests: true, // Assign tests, set conditions
          viewLiveStats: true, // View timer, interim results, candidate count
          evaluateCandidates: true,
          viewResults: true,
          viewTestErrors: true,
          finalize: true, // Finalize and close procedure
          finalizeDocumentation: true, // Export and send PDF
          importSharePoint: true,
        },
        templates: {
          create: true,
          read: true,
          provide: true, // Provide templates to gestor
        },
        storage: {
          view: true,
          upload: true,
          delete: true,
        },
        evaluation: {
          defineAbilities: true, // Predefine abilities/personality traits
          defineQuestions: true, // Select questions from database
          assignPoints: true,
          finalize: true,
        },
      }

    case 'subject_expert':
      // Vecný gestor - Creates ONLY professional knowledge tests from templates
      return {
        surveys: {
          create: false,
          createAll: false,
          createProfessional: true, // Can ONLY create professional knowledge tests
          read: true,
          update: true, // Can edit own tests
          duplicate: true, // Can duplicate tests
          delete: false,
        },
        users: {
          createStaff: false,
          createCandidates: false,
          invite: false,
          remove: false,
          updateRole: false,
        },
        procedures: {
          create: false,
          read: true, // Can view procedures they're assigned to
          update: false,
          delete: false,
          assignStaff: false,
          manageTests: false,
          viewLiveStats: false,
          evaluateCandidates: false,
          viewResults: false,
          viewTestErrors: false,
          finalize: false,
          finalizeDocumentation: false,
          importSharePoint: false,
        },
        templates: {
          create: false,
          read: true, // Can read templates provided by admin
          provide: false,
        },
        storage: {
          view: false,
          upload: false,
          delete: false,
        },
        evaluation: {
          defineAbilities: false,
          defineQuestions: false,
          assignPoints: false,
          finalize: false,
        },
      }

    case 'commission_chair':
      // Predseda komisie - Leads evaluation, can finalize
      return {
        surveys: {
          create: false,
          createAll: false,
          createProfessional: false,
          read: true,
          update: false,
          duplicate: false,
          delete: false,
        },
        users: {
          createStaff: false,
          createCandidates: false,
          invite: false,
          remove: false,
          updateRole: false,
        },
        procedures: {
          create: false,
          read: true, // Can view assigned procedures
          update: false,
          delete: false,
          assignStaff: false,
          manageTests: false,
          viewLiveStats: false,
          evaluateCandidates: true,
          viewResults: true,
          viewTestErrors: true, // Can view detailed test errors
          finalize: false,
          finalizeDocumentation: false,
          importSharePoint: false,
        },
        templates: {
          create: false,
          read: false,
          provide: false,
        },
        storage: {
          view: true, // Can view candidate documents (CV, certificates, etc)
          upload: false,
          delete: false,
        },
        evaluation: {
          defineAbilities: false,
          defineQuestions: false,
          assignPoints: true, // Can assign points during evaluation
          finalize: true, // Can finalize evaluations
        },
      }

    case 'commission_member':
      // Člen komisie - Evaluates candidates, cannot finalize
      return {
        surveys: {
          create: false,
          createAll: false,
          createProfessional: false,
          read: true,
          update: false,
          duplicate: false,
          delete: false,
        },
        users: {
          createStaff: false,
          createCandidates: false,
          invite: false,
          remove: false,
          updateRole: false,
        },
        procedures: {
          create: false,
          read: true, // Can view assigned procedures
          update: false,
          delete: false,
          assignStaff: false,
          manageTests: false,
          viewLiveStats: false,
          evaluateCandidates: true,
          viewResults: true,
          viewTestErrors: true, // Can view detailed test errors
          finalize: false,
          finalizeDocumentation: false, // CANNOT finalize
          importSharePoint: false,
        },
        templates: {
          create: false,
          read: false,
          provide: false,
        },
        storage: {
          view: true, // Can view candidate documents (CV, certificates, etc)
          upload: false,
          delete: false,
        },
        evaluation: {
          defineAbilities: false,
          defineQuestions: false,
          assignPoints: true, // Can assign points during evaluation
          finalize: false, // CANNOT finalize (only chair can)
        },
      }

    case 'candidate':
      // Uchádzač - Takes tests and views own results only
      return {
        surveys: {
          create: false,
          createAll: false,
          createProfessional: false,
          read: true, // Can read assigned tests
          update: false,
          duplicate: false,
          delete: false,
        },
        users: {
          createStaff: false,
          createCandidates: false,
          invite: false,
          remove: false,
          updateRole: false,
        },
        procedures: {
          create: false,
          read: true, // Can view own procedure
          update: false,
          delete: false,
          assignStaff: false,
          manageTests: false,
          viewLiveStats: false,
          evaluateCandidates: false,
          viewResults: true, // Can view own results
          viewTestErrors: false,
          finalize: false,
          finalizeDocumentation: false,
          importSharePoint: false,
        },
        templates: {
          create: false,
          read: false,
          provide: false,
        },
        storage: {
          view: false, // Cannot view other documents
          upload: false,
          delete: false,
        },
        evaluation: {
          defineAbilities: false,
          defineQuestions: false,
          assignPoints: false,
          finalize: false,
        },
      }

    case 'member':
      // Invited procedure member - NO organization-level permissions
      // Permissions are granted ONLY through procedure assignments
      // This is a base role for users invited to specific procedures
      return {
        surveys: {
          create: false,
          createAll: false,
          createProfessional: false,
          read: false,
          update: false,
          duplicate: false,
          delete: false,
        },
        users: {
          createStaff: false,
          createCandidates: false,
          invite: false,
          remove: false,
          updateRole: false,
        },
        procedures: {
          create: false,
          read: false, // Access controlled at procedure level
          update: false,
          delete: false,
          assignStaff: false,
          manageTests: false,
          viewLiveStats: false,
          evaluateCandidates: false,
          viewResults: false,
          viewTestErrors: false,
          finalize: false,
          finalizeDocumentation: false,
          importSharePoint: false,
        },
        templates: {
          create: false,
          read: false,
          provide: false,
        },
        storage: {
          view: false,
          upload: false,
          delete: false,
        },
        evaluation: {
          defineAbilities: false,
          defineQuestions: false,
          assignPoints: false,
          finalize: false,
        },
      }

    default:
      // No permissions for unknown roles
      return {}
  }
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(roleName: string, resource: keyof Permission, action: string): boolean {
  const permissions = getRolePermissions(roleName)

  if (!permissions || !permissions[resource]) {
    return false
  }

  const resourcePermissions = permissions[resource] as Record<string, boolean>
  return resourcePermissions[action] === true
}

/**
 * Require a specific permission or throw error
 */
export function requirePermission(roleName: string, resource: keyof Permission, action: string): void {
  if (!hasPermission(roleName, resource, action)) {
    throw createError({
      statusCode: 403,
      message: `You do not have permission to ${action} ${resource}`,
    })
  }
}

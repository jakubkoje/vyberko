import type { H3Event } from 'h3'

export async function getUserOrganization(userId: number, organizationId: number) {
  const db = useDrizzle()

  const result = await db
    .select({
      id: tables.userOrganizations.id,
      userId: tables.userOrganizations.userId,
      organizationId: tables.userOrganizations.organizationId,
      roleId: tables.userOrganizations.roleId,
      roleName: tables.roles.name,
      organizationName: tables.organizations.name,
      organizationSlug: tables.organizations.slug,
    })
    .from(tables.userOrganizations)
    .innerJoin(tables.roles, eq(tables.userOrganizations.roleId, tables.roles.id))
    .innerJoin(tables.organizations, eq(tables.userOrganizations.organizationId, tables.organizations.id))
    .where(
      and(
        eq(tables.userOrganizations.userId, userId),
        eq(tables.userOrganizations.organizationId, organizationId),
      ),
    )
    .limit(1)

  const userOrg = result[0]

  if (!userOrg) {
    return undefined
  }

  // Infer permissions from role name
  return {
    ...userOrg,
    permissions: getRolePermissions(userOrg.roleName),
  }
}

export async function getUserOrganizations(userId: number) {
  const db = useDrizzle()

  const results = await db
    .select({
      id: tables.userOrganizations.id,
      organizationId: tables.organizations.id,
      organizationName: tables.organizations.name,
      organizationSlug: tables.organizations.slug,
      roleId: tables.roles.id,
      roleName: tables.roles.name,
    })
    .from(tables.userOrganizations)
    .innerJoin(tables.organizations, eq(tables.userOrganizations.organizationId, tables.organizations.id))
    .innerJoin(tables.roles, eq(tables.userOrganizations.roleId, tables.roles.id))
    .where(eq(tables.userOrganizations.userId, userId))

  // Infer permissions from role names
  return results.map(result => ({
    ...result,
    permissions: getRolePermissions(result.roleName),
  }))
}

export async function getCurrentUser(event: H3Event) {
  // Get user from session
  const session = await requireUserSession(event)
  const userId = session.user.id

  const db = useDrizzle()
  const user = await db
    .select()
    .from(tables.users)
    .where(eq(tables.users.id, userId))
    .limit(1)

  if (!user.length) {
    throw createError({
      statusCode: 401,
      message: 'User not found',
    })
  }

  return user[0]
}

export async function getCurrentOrganizationId(event: H3Event): Promise<number> {
  const user = await getCurrentUser(event)

  if (!user.currentOrganizationId) {
    throw createError({
      statusCode: 400,
      message: 'No current organization set for user',
    })
  }

  return user.currentOrganizationId
}

export async function requireOrganizationAccess(
  event: H3Event,
  organizationId: number,
  resource: keyof Permission,
  action: string,
) {
  // Get actual user from session
  const session = await requireUserSession(event)
  const userId = session.user.id

  const userOrg = await getUserOrganization(userId, organizationId)

  if (!userOrg) {
    throw createError({
      statusCode: 403,
      message: 'You do not have access to this organization',
    })
  }

  if (!hasPermission(userOrg.roleName, resource, action)) {
    throw createError({
      statusCode: 403,
      message: `You do not have permission to ${action} ${resource}`,
    })
  }

  return userOrg
}

/**
 * Get user's role in a specific procedure
 */
export async function getUserProcedureRole(userId: number, procedureId: number) {
  const db = useDrizzle()

  const assignment = await db.query.procedureAssignments.findFirst({
    where: and(
      eq(tables.procedureAssignments.userId, userId),
      eq(tables.procedureAssignments.procedureId, procedureId),
    ),
    with: {
      role: true,
      procedure: true,
    },
  })

  return assignment
}

/**
 * Require procedure-specific permission check
 * Uses the user's procedure assignment role, NOT their organization role
 */
export async function requireProcedureAccess(
  event: H3Event,
  procedureId: number,
  resource: keyof Permission,
  action: string,
) {
  const session = await requireUserSession(event)
  const userId = session.user.id

  const db = useDrizzle()

  // Get procedure to verify it exists and get organization
  const procedure = await db.query.procedures.findFirst({
    where: eq(tables.procedures.id, procedureId),
  })

  if (!procedure) {
    throw createError({
      statusCode: 404,
      message: 'Procedure not found',
    })
  }

  // Check organization access first
  const userOrg = await getUserOrganization(userId, procedure.organizationId)
  if (!userOrg) {
    throw createError({
      statusCode: 403,
      message: 'You do not have access to this organization',
    })
  }

  // Admin has access to everything in their organization
  if (userOrg.roleName === 'admin') {
    return { userOrg, procedureRole: 'admin', isAdmin: true }
  }

  // For non-admins, check procedure-specific assignment
  const procedureAssignment = await getUserProcedureRole(userId, procedureId)

  if (!procedureAssignment) {
    throw createError({
      statusCode: 403,
      message: 'You are not assigned to this procedure',
    })
  }

  // Check permission using the PROCEDURE role, not org role
  const procedureRoleName = procedureAssignment.role.name

  if (!hasPermission(procedureRoleName, resource, action)) {
    throw createError({
      statusCode: 403,
      message: `You do not have permission to ${action} ${resource} in this procedure`,
    })
  }

  return { userOrg, procedureRole: procedureRoleName, procedureAssignment }
}

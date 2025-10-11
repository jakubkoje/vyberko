import type { H3Event } from 'h3'

export interface Permission {
  surveys?: {
    create?: boolean
    read?: boolean
    update?: boolean
    delete?: boolean
  }
  users?: {
    invite?: boolean
    remove?: boolean
    updateRole?: boolean
  }
  organization?: {
    update?: boolean
    delete?: boolean
  }
  procedures?: {
    create?: boolean
    read?: boolean
    update?: boolean
    delete?: boolean
  }
}

export async function getUserOrganization(userId: number, organizationId: number) {
  const db = useDrizzle()

  const result = await db
    .select({
      id: tables.userOrganizations.id,
      userId: tables.userOrganizations.userId,
      organizationId: tables.userOrganizations.organizationId,
      roleId: tables.userOrganizations.roleId,
      roleName: tables.roles.name,
      permissions: tables.roles.permissions,
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

  return result[0]
}

export async function getUserOrganizations(userId: number) {
  const db = useDrizzle()

  return await db
    .select({
      id: tables.userOrganizations.id,
      organizationId: tables.organizations.id,
      organizationName: tables.organizations.name,
      organizationSlug: tables.organizations.slug,
      roleId: tables.roles.id,
      roleName: tables.roles.name,
      permissions: tables.roles.permissions,
    })
    .from(tables.userOrganizations)
    .innerJoin(tables.organizations, eq(tables.userOrganizations.organizationId, tables.organizations.id))
    .innerJoin(tables.roles, eq(tables.userOrganizations.roleId, tables.roles.id))
    .where(eq(tables.userOrganizations.userId, userId))
}

export function hasPermission(permissions: Permission, resource: keyof Permission, action: string): boolean {
  if (!permissions || !permissions[resource]) {
    return false
  }

  const resourcePermissions = permissions[resource] as Record<string, boolean>
  return resourcePermissions[action] === true
}

export async function getCurrentUser(event: H3Event) {
  // TODO: Get userId from session/auth
  const userId = 1 // Temporary hardcode

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
  // TODO: Get userId from session/auth
  const userId = 1 // Temporary hardcode

  const userOrg = await getUserOrganization(userId, organizationId)

  if (!userOrg) {
    throw createError({
      statusCode: 403,
      message: 'You do not have access to this organization',
    })
  }

  const permissions = userOrg.permissions as Permission

  if (!hasPermission(permissions, resource, action)) {
    throw createError({
      statusCode: 403,
      message: `You do not have permission to ${action} ${resource}`,
    })
  }

  return userOrg
}

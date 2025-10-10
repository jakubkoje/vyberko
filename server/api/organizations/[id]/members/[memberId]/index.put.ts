export default defineEventHandler(async (event) => {
  const orgId = getRouterParam(event, 'orgId')
  const memberId = getRouterParam(event, 'memberId')

  if (!orgId || isNaN(Number(orgId))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid organization ID',
    })
  }

  if (!memberId || isNaN(Number(memberId))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid member ID',
    })
  }

  const organizationId = Number(orgId)
  const body = await readBody(event)

  if (!body.roleId) {
    throw createError({
      statusCode: 400,
      message: 'RoleId is required',
    })
  }

  // Check if user has permission to update roles
  await requireOrganizationAccess(event, organizationId, 'users', 'updateRole')

  const db = useDrizzle()

  // Check if trying to change owner role
  const member = await db
    .select({
      roleId: tables.userOrganizations.roleId,
      roleName: tables.roles.name,
    })
    .from(tables.userOrganizations)
    .innerJoin(tables.roles, eq(tables.userOrganizations.roleId, tables.roles.id))
    .where(eq(tables.userOrganizations.id, Number(memberId)))
    .limit(1)

  if (!member.length) {
    throw createError({
      statusCode: 404,
      message: 'Member not found',
    })
  }

  if (member[0].roleName === 'owner') {
    throw createError({
      statusCode: 403,
      message: 'Cannot change owner role',
    })
  }

  // Update role
  const updated = await db
    .update(tables.userOrganizations)
    .set({
      roleId: body.roleId,
    })
    .where(
      and(
        eq(tables.userOrganizations.id, Number(memberId)),
        eq(tables.userOrganizations.organizationId, organizationId),
      ),
    )
    .returning()

  if (!updated.length) {
    throw createError({
      statusCode: 404,
      message: 'Member not found',
    })
  }

  return { success: true }
})

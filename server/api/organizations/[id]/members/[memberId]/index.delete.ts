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

  // Check if user has permission to remove members
  await requireOrganizationAccess(event, organizationId, 'users', 'remove')

  const db = useDrizzle()

  // Check if trying to remove owner
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
      message: 'Cannot remove organization owner',
    })
  }

  // Remove member
  await db
    .delete(tables.userOrganizations)
    .where(
      and(
        eq(tables.userOrganizations.id, Number(memberId)),
        eq(tables.userOrganizations.organizationId, organizationId),
      ),
    )

  return { success: true }
})

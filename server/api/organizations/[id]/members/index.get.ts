export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid organization ID',
    })
  }

  const organizationId = Number(id)

  // Check if user has access to view members
  await requireOrganizationAccess(event, organizationId, 'users', 'invite')

  const db = useDrizzle()

  const members = await db
    .select({
      id: tables.userOrganizations.id,
      userId: tables.users.id,
      userName: tables.users.name,
      userEmail: tables.users.email,
      userAvatar: tables.users.avatar,
      roleId: tables.roles.id,
      roleName: tables.roles.name,
      joinedAt: tables.userOrganizations.createdAt,
    })
    .from(tables.userOrganizations)
    .innerJoin(tables.users, eq(tables.userOrganizations.userId, tables.users.id))
    .innerJoin(tables.roles, eq(tables.userOrganizations.roleId, tables.roles.id))
    .where(eq(tables.userOrganizations.organizationId, organizationId))

  console.log(members)
  return members
})

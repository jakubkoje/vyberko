export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid organization ID',
    })
  }

  // TODO: Get userId from session/auth
  const userId = 1 // Temporary hardcode

  // Check if user has access to this organization
  const userOrg = await getUserOrganization(userId, Number(id))

  if (!userOrg) {
    throw createError({
      statusCode: 403,
      message: 'You do not have access to this organization',
    })
  }

  const db = useDrizzle()

  const org = await db
    .select()
    .from(tables.organizations)
    .where(eq(tables.organizations.id, Number(id)))
    .limit(1)

  if (!org.length) {
    throw createError({
      statusCode: 404,
      message: 'Organization not found',
    })
  }

  return {
    ...org[0],
    role: userOrg.roleName,
    permissions: userOrg.permissions,
  }
})

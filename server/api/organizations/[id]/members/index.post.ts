export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid organization ID',
    })
  }

  const organizationId = Number(id)
  const body = await readBody(event)

  if (!body.email || !body.name || !body.roleId) {
    throw createError({
      statusCode: 400,
      message: 'Email, name, and roleId are required',
    })
  }

  // Check if user has permission to invite
  await requireOrganizationAccess(event, organizationId, 'users', 'invite')

  const db = useDrizzle()

  // Check if user already exists
  let user = await db
    .select()
    .from(tables.users)
    .where(eq(tables.users.email, body.email))
    .limit(1)

  // Create user if doesn't exist (simplified - in production, send invitation email)
  if (!user.length) {
    const newUser = await db
      .insert(tables.users)
      .values({
        email: body.email,
        name: body.name,
        password: 'TEMP_PASSWORD', // In production: generate temp password or use invitation flow
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${body.email}`,
      })
      .returning()

    user = newUser
  }

  // Check if user is already a member
  const existing = await db
    .select()
    .from(tables.userOrganizations)
    .where(
      and(
        eq(tables.userOrganizations.userId, user[0].id),
        eq(tables.userOrganizations.organizationId, organizationId),
      ),
    )
    .limit(1)

  if (existing.length) {
    throw createError({
      statusCode: 400,
      message: 'User is already a member of this organization',
    })
  }

  // Add user to organization
  await db
    .insert(tables.userOrganizations)
    .values({
      userId: user[0].id,
      organizationId,
      roleId: body.roleId,
    })

  return {
    success: true,
    user: {
      id: user[0].id,
      name: user[0].name,
      email: user[0].email,
    },
  }
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.name) {
    throw createError({
      statusCode: 400,
      message: 'Organization name is required',
    })
  }

  // TODO: Get userId from session/auth
  const userId = 1 // Temporary hardcode

  // Generate slug from name
  const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  const db = useDrizzle()

  // Create organization
  const newOrg = await db
    .insert(tables.organizations)
    .values({
      name: body.name,
      slug,
    })
    .returning()

  if (!newOrg.length) {
    throw createError({
      statusCode: 500,
      message: 'Failed to create organization',
    })
  }

  // Get owner role
  const ownerRole = await db
    .select()
    .from(tables.roles)
    .where(eq(tables.roles.name, 'owner'))
    .limit(1)

  if (!ownerRole.length) {
    throw createError({
      statusCode: 500,
      message: 'Owner role not found',
    })
  }

  // Add user as owner
  await db
    .insert(tables.userOrganizations)
    .values({
      userId,
      organizationId: newOrg[0].id,
      roleId: ownerRole[0].id,
    })

  // Set as current organization
  await db
    .update(tables.users)
    .set({ currentOrganizationId: newOrg[0].id })
    .where(eq(tables.users.id, userId))

  return newOrg[0]
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.title) {
    throw createError({
      statusCode: 400,
      message: 'Title is required',
    })
  }

  // Get current organization and user from context
  const organizationId = await getCurrentOrganizationId(event)
  const user = await getCurrentUser(event)

  // Check if user has access to create procedures
  await requireOrganizationAccess(event, organizationId, 'procedures', 'create')

  const db = useDrizzle()

  const newProcedure = await db
    .insert(tables.procedures)
    .values({
      title: body.title,
      description: body.description || null,
      status: body.status || 'active',
      organizationId,
      createdById: user.id,
    })
    .returning()

  return newProcedure[0]
})

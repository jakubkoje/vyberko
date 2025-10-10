export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.title) {
    throw createError({
      statusCode: 400,
      message: 'Title is required',
    })
  }

  if (!body.organizationId) {
    throw createError({
      statusCode: 400,
      message: 'Organization ID is required',
    })
  }

  // Check if user has access to create procedures
  await requireOrganizationAccess(event, body.organizationId, 'procedures', 'create')

  // TODO: Get userId from session/auth
  const userId = 1 // Temporary hardcode

  const db = useDrizzle()

  const newProcedure = await db
    .insert(tables.procedures)
    .values({
      title: body.title,
      description: body.description || null,
      status: body.status || 'active',
      organizationId: body.organizationId,
      createdById: userId,
    })
    .returning()

  return newProcedure[0]
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid procedure ID',
    })
  }

  const db = useDrizzle()

  // Get existing procedure to check organization
  const existing = await db
    .select()
    .from(tables.procedures)
    .where(eq(tables.procedures.id, Number(id)))
    .limit(1)

  if (!existing.length) {
    throw createError({
      statusCode: 404,
      message: 'Procedure not found',
    })
  }

  // Check if user has access to update this procedure
  await requireOrganizationAccess(event, existing[0].organizationId, 'procedures', 'update')

  const updated = await db
    .update(tables.procedures)
    .set({
      title: body.title,
      description: body.description,
      status: body.status,
    })
    .where(eq(tables.procedures.id, Number(id)))
    .returning()

  return updated[0]
})

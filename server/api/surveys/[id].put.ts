export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid survey ID',
    })
  }

  const body = await readBody(event)

  if (!body.jsonData) {
    throw createError({
      statusCode: 400,
      message: 'Survey JSON data is required',
    })
  }

  const db = useDrizzle()

  // Get the survey first to check organization
  const existing = await db
    .select()
    .from(tables.surveys)
    .where(eq(tables.surveys.id, Number(id)))
    .limit(1)

  if (!existing.length) {
    throw createError({
      statusCode: 404,
      message: 'Survey not found',
    })
  }

  // Check if user has access to update surveys
  await requireOrganizationAccess(event, existing[0].organizationId, 'surveys', 'update')

  const updated = await db
    .update(tables.surveys)
    .set({
      jsonData: body.jsonData,
      title: body.title || 'Untitled Survey',
      category: body.category || existing[0].category,
    })
    .where(eq(tables.surveys.id, Number(id)))
    .returning()

  return updated[0]
})

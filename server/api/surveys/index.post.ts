export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.jsonData) {
    throw createError({
      statusCode: 400,
      message: 'Survey JSON data is required',
    })
  }

  if (!body.category) {
    throw createError({
      statusCode: 400,
      message: 'Survey category is required',
    })
  }

  // Get current organization and user from context
  const organizationId = await getCurrentOrganizationId(event)
  const user = await getCurrentUser(event)

  // Check if user has access to create surveys
  await requireOrganizationAccess(event, organizationId, 'surveys', 'create')

  const db = useDrizzle()

  const newSurvey = await db
    .insert(tables.surveys)
    .values({
      jsonData: body.jsonData,
      title: body.title || 'Untitled Survey',
      category: body.category,
      organizationId,
      createdById: user.id,
    })
    .returning()

  return newSurvey[0]
})

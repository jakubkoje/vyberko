export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.jsonData) {
    throw createError({
      statusCode: 400,
      message: 'Survey JSON data is required',
    })
  }

  if (!body.organizationId) {
    throw createError({
      statusCode: 400,
      message: 'Organization ID is required',
    })
  }

  // Check if user has access to create surveys
  await requireOrganizationAccess(event, body.organizationId, 'surveys', 'create')

  // TODO: Get userId from session/auth
  const userId = 1 // Temporary hardcode

  const db = useDrizzle()

  const newSurvey = await db
    .insert(tables.surveys)
    .values({
      jsonData: body.jsonData,
      title: body.title || 'Untitled Survey',
      organizationId: body.organizationId,
      createdById: userId,
    })
    .returning()

  return newSurvey[0]
})

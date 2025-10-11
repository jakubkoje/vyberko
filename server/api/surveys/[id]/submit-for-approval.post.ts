export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid survey ID',
    })
  }

  const db = useDrizzle()

  // Get survey to check permissions
  const survey = await db
    .select()
    .from(tables.surveys)
    .where(eq(tables.surveys.id, Number(id)))
    .limit(1)

  if (!survey.length) {
    throw createError({
      statusCode: 404,
      message: 'Survey not found',
    })
  }

  // Check if user has permission to submit (gestor can submit their own surveys)
  const user = await getCurrentUser(event)
  if (survey[0].createdById !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'You can only submit your own surveys for approval',
    })
  }

  // Update survey status to pending_approval
  const updated = await db
    .update(tables.surveys)
    .set({
      status: 'pending_approval',
    })
    .where(eq(tables.surveys.id, Number(id)))
    .returning()

  return updated[0]
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid survey ID',
    })
  }

  if (!body.rejectionReason) {
    throw createError({
      statusCode: 400,
      message: 'Rejection reason is required',
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

  // Check if user has permission to reject (admin only)
  await requireOrganizationAccess(event, survey[0].organizationId, 'surveys', 'approve')

  // Update survey status to rejected
  const updated = await db
    .update(tables.surveys)
    .set({
      status: 'rejected',
      rejectionReason: body.rejectionReason,
    })
    .where(eq(tables.surveys.id, Number(id)))
    .returning()

  return updated[0]
})

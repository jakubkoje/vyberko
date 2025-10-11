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

  // Check if user has permission to approve (admin only)
  await requireOrganizationAccess(event, survey[0].organizationId, 'surveys', 'approve')

  // Update survey status to approved
  const updated = await db
    .update(tables.surveys)
    .set({
      status: 'approved',
      rejectionReason: null,
    })
    .where(eq(tables.surveys.id, Number(id)))
    .returning()

  return updated[0]
})

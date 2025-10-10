export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid survey ID',
    })
  }

  const db = useDrizzle()
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

  // Check if user has access to this organization
  await requireOrganizationAccess(event, survey[0].organizationId, 'surveys', 'read')

  return survey[0]
})

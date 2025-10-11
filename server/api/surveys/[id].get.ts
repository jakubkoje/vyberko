export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid survey ID',
    })
  }

  const db = useDrizzle()
  const survey = await db.query.surveys.findFirst({
    where: eq(tables.surveys.id, Number(id)),
    with: {
      procedureSurvey: {
        with: {
          procedure: true,
        },
      },
    },
  })

  if (!survey) {
    throw createError({
      statusCode: 404,
      message: 'Survey not found',
    })
  }

  // Check if user has access to this organization
  await requireOrganizationAccess(event, survey.organizationId, 'surveys', 'read')

  return survey
})

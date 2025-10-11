export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid procedure ID',
    })
  }

  if (!body.surveyId) {
    throw createError({
      statusCode: 400,
      message: 'Survey ID is required',
    })
  }

  const db = useDrizzle()

  // Get procedure to check organization access
  const procedure = await db
    .select()
    .from(tables.procedures)
    .where(eq(tables.procedures.id, Number(id)))
    .limit(1)

  if (!procedure.length) {
    throw createError({
      statusCode: 404,
      message: 'Procedure not found',
    })
  }

  await requireOrganizationAccess(event, procedure[0].organizationId, 'procedures', 'update')

  // Get the survey to determine its category
  const survey = await db
    .select()
    .from(tables.surveys)
    .where(eq(tables.surveys.id, body.surveyId))
    .limit(1)

  if (!survey.length) {
    throw createError({
      statusCode: 404,
      message: 'Survey not found',
    })
  }

  // Check if survey is already assigned to another procedure
  const existingAssignment = await db
    .select()
    .from(tables.procedureSurveys)
    .where(eq(tables.procedureSurveys.surveyId, body.surveyId))
    .limit(1)

  if (existingAssignment.length > 0 && existingAssignment[0].procedureId !== Number(id)) {
    throw createError({
      statusCode: 400,
      message: 'This survey is already assigned to another procedure',
    })
  }

  // Get the highest order number for this survey's category in this procedure
  // We need to join with surveys to filter by category
  const existingSurveysInCategory = await db
    .select({
      order: tables.procedureSurveys.order,
    })
    .from(tables.procedureSurveys)
    .innerJoin(tables.surveys, eq(tables.procedureSurveys.surveyId, tables.surveys.id))
    .where(
      and(
        eq(tables.procedureSurveys.procedureId, Number(id)),
        eq(tables.surveys.category, survey[0].category),
      ),
    )
    .orderBy(desc(tables.procedureSurveys.order))
    .limit(1)

  const nextOrder = existingSurveysInCategory.length > 0 ? (existingSurveysInCategory[0].order || 0) + 1 : 0

  const newProcedureSurvey = await db
    .insert(tables.procedureSurveys)
    .values({
      procedureId: Number(id),
      surveyId: body.surveyId,
      order: nextOrder,
    })
    .returning()

  return newProcedureSurvey[0]
})

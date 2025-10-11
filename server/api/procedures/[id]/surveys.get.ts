export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid procedure ID',
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

  await requireOrganizationAccess(event, procedure[0].organizationId, 'procedures', 'read')

  // Get all surveys for this procedure
  const procedureSurveys = await db
    .select({
      id: tables.procedureSurveys.id,
      procedureId: tables.procedureSurveys.procedureId,
      surveyId: tables.procedureSurveys.surveyId,
      category: tables.surveys.category,
      order: tables.procedureSurveys.order,
      surveyTitle: tables.surveys.title,
      surveyJsonData: tables.surveys.jsonData,
    })
    .from(tables.procedureSurveys)
    .innerJoin(tables.surveys, eq(tables.procedureSurveys.surveyId, tables.surveys.id))
    .where(eq(tables.procedureSurveys.procedureId, Number(id)))
    .orderBy(tables.surveys.category, tables.procedureSurveys.order)

  return procedureSurveys
})

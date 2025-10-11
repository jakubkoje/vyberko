export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid procedure survey ID',
    })
  }

  const db = useDrizzle()

  // Get the procedure survey to check access
  const procedureSurvey = await db
    .select()
    .from(tables.procedureSurveys)
    .where(eq(tables.procedureSurveys.id, Number(id)))
    .limit(1)

  if (!procedureSurvey.length) {
    throw createError({
      statusCode: 404,
      message: 'Procedure survey not found',
    })
  }

  // Get procedure to check organization access
  const procedure = await db
    .select()
    .from(tables.procedures)
    .where(eq(tables.procedures.id, procedureSurvey[0].procedureId))
    .limit(1)

  if (!procedure.length) {
    throw createError({
      statusCode: 404,
      message: 'Procedure not found',
    })
  }

  await requireOrganizationAccess(event, procedure[0].organizationId, 'procedures', 'update')

  await db
    .delete(tables.procedureSurveys)
    .where(eq(tables.procedureSurveys.id, Number(id)))

  return { success: true }
})

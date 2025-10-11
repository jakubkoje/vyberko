export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Procedure survey ID is required',
    })
  }

  const db = useDrizzle()

  // Get the procedure survey to check permissions
  const procedureSurvey = await db
    .select()
    .from(tables.procedureSurveys)
    .where(eq(tables.procedureSurveys.id, id))
    .limit(1)

  if (!procedureSurvey.length) {
    throw createError({
      statusCode: 404,
      message: 'Procedure survey not found',
    })
  }

  // Get the procedure to check organization access
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

  // Check if user has permission to manage tests
  await requireOrganizationAccess(event, procedure[0].organizationId, 'procedures', 'manageTests')

  // Update the procedure survey with test conditions
  const updated = await db
    .update(tables.procedureSurveys)
    .set({
      timeLimit: body.timeLimit !== undefined ? body.timeLimit : undefined,
      totalPoints: body.totalPoints !== undefined ? body.totalPoints : undefined,
      passingScore: body.passingScore !== undefined ? body.passingScore : undefined,
    })
    .where(eq(tables.procedureSurveys.id, id))
    .returning()

  return updated[0]
})

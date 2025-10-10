export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid contender ID',
    })
  }

  const db = useDrizzle()

  // First, get the contender to verify it exists
  const contender = await db
    .select()
    .from(tables.contenders)
    .where(eq(tables.contenders.id, Number(id)))
    .limit(1)

  if (!contender.length) {
    throw createError({
      statusCode: 404,
      message: 'Contender not found',
    })
  }

  // Get the procedure to check organization access
  const procedure = await db
    .select()
    .from(tables.procedures)
    .where(eq(tables.procedures.id, contender[0].procedureId))
    .limit(1)

  if (!procedure.length) {
    throw createError({
      statusCode: 404,
      message: 'Procedure not found',
    })
  }

  // Check if user has access to this organization
  await requireOrganizationAccess(event, procedure[0].organizationId, 'procedures', 'read')

  // Get all exam scores for this contender with criteria details
  const scores = await db
    .select({
      id: tables.examScores.id,
      contenderId: tables.examScores.contenderId,
      criteriaId: tables.examScores.criteriaId,
      score: tables.examScores.score,
      criteriaName: tables.examCriteria.name,
      minRating: tables.examCriteria.minRating,
      maxRating: tables.examCriteria.maxRating,
      evaluatedById: tables.examScores.evaluatedById,
      createdAt: tables.examScores.createdAt,
      updatedAt: tables.examScores.updatedAt,
    })
    .from(tables.examScores)
    .innerJoin(tables.examCriteria, eq(tables.examScores.criteriaId, tables.examCriteria.id))
    .where(eq(tables.examScores.contenderId, Number(id)))

  return scores
})

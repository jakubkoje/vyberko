export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid contender ID',
    })
  }

  const body = await readBody(event)

  // Validate body structure: { scores: [{ criteriaId: number, score: number }] }
  if (!body.scores || !Array.isArray(body.scores)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body. Expected { scores: [{ criteriaId, score }] }',
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
  const session = await requireOrganizationAccess(event, procedure[0].organizationId, 'procedures', 'write')

  // Upsert exam scores
  const results = []
  for (const scoreData of body.scores) {
    const { criteriaId, score } = scoreData

    if (!criteriaId || score === undefined || score === null) {
      continue // Skip invalid entries
    }

    // Check if score already exists
    const existingScore = await db
      .select()
      .from(tables.examScores)
      .where(
        and(
          eq(tables.examScores.contenderId, Number(id)),
          eq(tables.examScores.criteriaId, criteriaId),
        ),
      )
      .limit(1)

    if (existingScore.length > 0) {
      // Update existing score
      const updated = await db
        .update(tables.examScores)
        .set({
          score,
          evaluatedById: session.user.id,
        })
        .where(eq(tables.examScores.id, existingScore[0].id))
        .returning()

      results.push(updated[0])
    }
    else {
      // Insert new score
      const inserted = await db
        .insert(tables.examScores)
        .values({
          contenderId: Number(id),
          criteriaId,
          score,
          evaluatedById: session.user.id,
        })
        .returning()

      results.push(inserted[0])
    }
  }

  return results
})

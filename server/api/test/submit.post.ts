export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { code, testId, surveyId, answersData, score, totalQuestions, isPassed, timeSpent, startedAt } = body

  if (!code || !surveyId || !answersData) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Access code, survey ID, and answers data are required',
    })
  }

  const db = useDrizzle()

  // Find contender by access code
  const contender = await db.query.contenders.findFirst({
    where: eq(tables.contenders.cisIdentifier, code),
  })

  if (!contender) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Invalid access code',
    })
  }

  // Check if response already exists for this survey
  const existingResponse = await db.query.surveyResponses.findFirst({
    where: and(
      eq(tables.surveyResponses.contenderId, contender.id),
      eq(tables.surveyResponses.surveyId, surveyId),
    ),
  })

  if (existingResponse) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Test already submitted',
    })
  }

  // Get survey to check passing criteria
  const survey = await db.query.surveys.findFirst({
    where: eq(tables.surveys.id, surveyId),
  })

  if (!survey) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Survey not found',
    })
  }

  // Get procedure survey for passing score
  const procedureSurvey = await db.query.procedureSurveys.findFirst({
    where: and(
      eq(tables.procedureSurveys.surveyId, surveyId),
      eq(tables.procedureSurveys.procedureId, contender.procedureId),
    ),
  })

  // Use isPassed from frontend (already calculated with correct logic)
  const passedValue = isPassed ? 1 : 0

  // Save survey response
  await db.insert(tables.surveyResponses).values({
    contenderId: contender.id,
    surveyId,
    procedureId: contender.procedureId,
    responseData: answersData,
    score: score,
    totalQuestions: totalQuestions || null,
    isPassed: passedValue,
    startedAt: startedAt ? new Date(startedAt) : new Date(),
    submittedAt: new Date(),
    timeSpentSeconds: timeSpent || null,
  })

  console.log('Test submitted:', {
    code,
    contenderId: contender.id,
    surveyId,
    score,
    totalQuestions,
    isPassed,
    timeSpent,
  })

  return {
    success: true,
    message: 'Test results successfully submitted',
    score,
    totalQuestions,
    isPassed,
  }
})


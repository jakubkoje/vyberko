export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Access code is required',
    })
  }

  const db = useDrizzle()

  // Find contender by CIS identifier (access code)
  const contender = await db.query.contenders.findFirst({
    where: eq(tables.contenders.cisIdentifier, code),
    with: {
      procedure: {
        with: {
          procedureSurveys: {
            with: {
              survey: true,
            },
            orderBy: asc(tables.procedureSurveys.order),
          },
        },
      },
    },
  })

  if (!contender) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Invalid access code',
    })
  }

  // Get written exam surveys (exclude non-written categories if needed)
  const surveys = contender.procedure.procedureSurveys

  if (!surveys || surveys.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No tests available for this procedure',
    })
  }

  // Transform surveys to test format
  const tests = surveys.map((ps) => {
    const surveyData = ps.survey.jsonData as any

    // Priority: use maxTimeToFinish from jsonData (in seconds),
    // otherwise use procedureSurveys.timeLimit (in minutes, convert to seconds)
    const timeLimit = surveyData.maxTimeToFinish
      ? surveyData.maxTimeToFinish
      : (ps.timeLimit ? ps.timeLimit * 60 : null)

    return {
      id: ps.surveyId,
      surveyId: ps.surveyId,
      procedureSurveyId: ps.id,
      title: ps.survey.title,
      description: surveyData.description || '',
      showTimer: !!timeLimit,
      timeLimit,
      totalPoints: ps.totalPoints,
      passingScore: ps.passingScore,
      ...surveyData,
    }
  })

  return {
    tests,
    session: {
      accessCode: code,
      contenderId: contender.id,
      procedureId: contender.procedureId,
      currentTestIndex: 0,
      completedTests: [],
    },
  }
})


import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const contenderId = Number(getRouterParam(event, 'id'))

  if (!contenderId || Number.isNaN(contenderId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid contender ID',
    })
  }

  const db = useDrizzle()

  // Get contender to check permissions
  const contender = await db.query.contenders.findFirst({
    where: eq(tables.contenders.id, contenderId),
    with: {
      procedure: true,
    },
  })

  if (!contender) {
    throw createError({
      statusCode: 404,
      message: 'Contender not found',
    })
  }

  // Check if user has permission to view test results
  await requireOrganizationAccess(event, contender.procedure.organizationId, 'procedures', 'viewResults')

  // Get all survey responses for this contender with survey details
  const responses = await db.query.surveyResponses.findMany({
    where: eq(tables.surveyResponses.contenderId, contenderId),
    with: {
      survey: true,
    },
    orderBy: desc(tables.surveyResponses.createdAt),
  })

  // Transform responses to include parsed questions and answers
  const results = responses.map((response) => {
    const surveyJson = response.survey.jsonData as any
    const responseData = response.responseData as any

    // Extract questions from survey JSON (SurveyJS format)
    const questions: Array<{
      name: string
      title: string
      type: string
      correctAnswer?: any
      choices?: Array<{ value: string, text: string }>
    }> = []

    if (surveyJson.pages) {
      for (const page of surveyJson.pages) {
        if (page.elements) {
          for (const element of page.elements) {
            questions.push({
              name: element.name,
              title: element.title || element.name,
              type: element.type,
              correctAnswer: element.correctAnswer,
              choices: element.choices,
            })
          }
        }
      }
    }

    // Match questions with answers
    const questionsWithAnswers = questions.map((question) => {
      const userAnswer = responseData[question.name]
      const isCorrect = question.correctAnswer !== undefined
        ? userAnswer === question.correctAnswer
        : null

      return {
        ...question,
        userAnswer,
        isCorrect,
      }
    })

    return {
      id: response.id,
      surveyId: response.surveyId,
      surveyTitle: response.survey.title,
      surveyCategory: response.survey.category,
      score: response.score,
      isPassed: response.isPassed,
      startedAt: response.startedAt,
      submittedAt: response.submittedAt,
      timeSpentSeconds: response.timeSpentSeconds,
      questionsWithAnswers,
      totalQuestions: questions.length,
      correctAnswers: questionsWithAnswers.filter(q => q.isCorrect === true).length,
    }
  })

  return results
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { code, results, score, timeSpent } = body

  if (!code || !results) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Access code and results are required'
    })
  }

  // TODO: Validate access code
  // const codeData = await db.query.accessCodes.findFirst({
  //   where: eq(accessCodes.code, code)
  // })
  // 
  // if (!codeData || codeData.used) {
  //   throw createError({
  //     statusCode: 401,
  //     statusMessage: 'Invalid or already used access code'
  //   })
  // }

  // TODO: Save results to database
  // await db.insert(testResults).values({
  //   accessCodeId: codeData.id,
  //   userId: codeData.userId,
  //   testId: codeData.testId,
  //   answers: results,
  //   score: score.score,
  //   totalQuestions: score.total,
  //   percentage: score.percentage,
  //   timeSpent,
  //   completedAt: new Date()
  // })

  // TODO: Mark access code as used
  // await db.update(accessCodes)
  //   .set({ used: true, usedAt: new Date() })
  //   .where(eq(accessCodes.id, codeData.id))

  // TODO: Send confirmation email
  // await sendEmail({
  //   to: codeData.userEmail,
  //   subject: 'Test dokončený - Potvrdenie',
  //   template: 'test-completion',
  //   data: {
  //     score: score.score,
  //     total: score.total,
  //     percentage: score.percentage
  //   }
  // })

  console.log('Test submitted:', {
    code,
    score,
    timeSpent,
    answersCount: Object.keys(results).length
  })

  return {
    success: true,
    message: 'Test results successfully submitted',
    score
  }
})


// Simple in-memory session storage for demo
// In production, this should be in database
const testSessions = new Map<string, { startDate: string; endDate: string }>()

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Access code is required'
    })
  }

  // TODO: Validate access code in database
  // const isValid = await validateAccessCode(code)
  // if (!isValid) {
  //   throw createError({
  //     statusCode: 401,
  //     statusMessage: 'Invalid or expired access code'
  //   })
  // }

  // TODO: Fetch test configuration from database based on code
  // const testSession = await db.query.testSessions.findFirst({
  //   where: eq(testSessions.accessCode, code),
  //   with: { testConfiguration: true }
  // })
  
  // For demo: Use in-memory storage to persist session dates
  // In production, this should be in database
  let sessionDates = testSessions.get(code)
  
  if (!sessionDates) {
    // Create new session with start and end dates
    const now = new Date()
    const duration = 900 // 15 minutes in seconds
    const endDate = new Date(now.getTime() + duration * 1000)
    
    sessionDates = {
      startDate: now.toISOString(),
      endDate: endDate.toISOString()
    }
    
    // Store in memory (in production, save to database)
    testSessions.set(code, sessionDates)
    
    console.log(`Created new test session for code: ${code}`, sessionDates)
  } else {
    console.log(`Retrieved existing test session for code: ${code}`, sessionDates)
  }

  // For now, return example configuration with session dates
  // In production, this should come from database
  return {
    title: "Odborny test",
    description: "Test test je na overenie odbornych zrusti praxe, pre pozicii, ktoru sa hlasite.",
    showTimer: true,
    timeLimit: 900, // 15 minutes in seconds
    startDate: sessionDates.startDate, // ISO 8601 format from session
    endDate: sessionDates.endDate, // ISO 8601 format from session
    headerView: "advanced",
    pages: [
      {
        name: "page1",
        elements: [
          {
            type: "radiogroup",
            name: "question1",
            title: "Ako sa mas?",
            correctAnswer: "Item 1",
            isRequired: true,
            choices: [
              {
                value: "Item 1",
                text: "dobre"
              },
              {
                value: "Item 2",
                text: "nie dobre"
              },
              {
                value: "Item 3",
                text: "neviem"
              },
              {
                value: "Item 4",
                text: "zle"
              }
            ]
          },
          {
            type: "checkbox",
            name: "question2",
            title: "Oznacte vsetky spisovne slova.",
            correctAnswer: [
              "Item 1",
              "Item 2",
              "Item 3"
            ],
            choices: [
              {
                value: "Item 1",
                text: "jakub"
              },
              {
                value: "Item 2",
                text: "ano"
              },
              {
                value: "Item 3",
                text: "itinerar"
              },
              {
                value: "Item 4",
                text: "alfredovity"
              },
              {
                value: "Item 5",
                text: "jakubovic"
              }
            ]
          }
        ]
      }
    ]
  }
})


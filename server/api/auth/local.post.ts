import { eq, and } from 'drizzle-orm'
import * as v from 'valibot'

const loginSchema = v.object({
  cisIdentifier: v.pipe(v.string(), v.minLength(1, 'CIS identifier is required')),
  password: v.pipe(v.string(), v.minLength(1, 'Password is required')),
})

export default defineEventHandler(async (event) => {
  const db = useDrizzle()

  // Parse and validate request body
  const body = await readBody(event)
  const validation = v.safeParse(loginSchema, body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: validation.issues[0].message,
    })
  }

  const { cisIdentifier, password } = validation.output

  // Find contender by CIS identifier
  const contender = await db.query.contenders.findFirst({
    where: eq(tables.contenders.cisIdentifier, cisIdentifier),
    with: {
      procedure: true,
    },
  })

  if (!contender) {
    throw createError({
      statusCode: 401,
      message: 'Invalid credentials',
    })
  }

  // Check if contender has a linked user account
  if (!contender.userId) {
    throw createError({
      statusCode: 401,
      message: 'No user account found for this candidate',
    })
  }

  // Get the user account
  const user = await db.query.users.findFirst({
    where: and(
      eq(tables.users.id, contender.userId),
      eq(tables.users.authProvider, 'local'),
    ),
  })

  if (!user || !user.password) {
    throw createError({
      statusCode: 401,
      message: 'Invalid credentials',
    })
  }

  // Verify password using nuxt-auth-utils hashPassword/verifyPassword
  const isValidPassword = await verifyPassword(user.password, password)

  if (!isValidPassword) {
    throw createError({
      statusCode: 401,
      message: 'Invalid credentials',
    })
  }

  // Set user session
  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: 'candidate',
      authProvider: 'local',
      contenderId: contender.id,
      procedureId: contender.procedureId,
    },
    loggedInAt: new Date().toISOString(),
  })

  return {
    success: true,
    redirectTo: `/procedure/${contender.procedureId}/test`,
  }
})

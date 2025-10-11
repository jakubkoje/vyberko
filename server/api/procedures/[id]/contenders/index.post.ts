// Generate a secure temporary password
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const length = 12
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export default defineEventHandler(async (event) => {
  const procedureId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!procedureId || isNaN(Number(procedureId))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid procedure ID',
    })
  }

  if (!body.name || !body.email || !body.cisIdentifier) {
    throw createError({
      statusCode: 400,
      message: 'Name, email, and CIS identifier are required',
    })
  }

  const db = useDrizzle()

  // Get procedure to check organization access
  const procedure = await db
    .select()
    .from(tables.procedures)
    .where(eq(tables.procedures.id, Number(procedureId)))
    .limit(1)

  if (!procedure.length) {
    throw createError({
      statusCode: 404,
      message: 'Procedure not found',
    })
  }

  // Check if user has access to create contenders (admin can create candidates)
  await requireOrganizationAccess(event, procedure[0].organizationId, 'users', 'createCandidates')

  // Check if cisIdentifier already exists for this procedure
  const existingContender = await db
    .select()
    .from(tables.contenders)
    .where(and(
      eq(tables.contenders.cisIdentifier, body.cisIdentifier),
      eq(tables.contenders.procedureId, Number(procedureId)),
    ))
    .limit(1)

  if (existingContender.length > 0) {
    throw createError({
      statusCode: 400,
      message: 'A contender with this CIS identifier already exists in this procedure',
    })
  }

  // Generate temporary password
  const temporaryPassword = generateTemporaryPassword()

  // Hash the password
  const hashedPassword = await hashPassword(temporaryPassword)

  // Create user account for candidate
  const newUser = await db
    .insert(tables.users)
    .values({
      name: body.name,
      email: body.email,
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(body.name)}`,
      authProvider: 'local',
    })
    .returning()

  // Create contender and link to user
  const newContender = await db
    .insert(tables.contenders)
    .values({
      cisIdentifier: body.cisIdentifier,
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      status: body.status || 'registered',
      notes: body.notes || null,
      userId: newUser[0].id,
      procedureId: Number(procedureId),
    })
    .returning()

  // Return contender with credentials
  return {
    ...newContender[0],
    credentials: {
      username: body.cisIdentifier,
      temporaryPassword,
    },
  }
})

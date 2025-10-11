import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const procedureId = Number(getRouterParam(event, 'id'))

  if (!procedureId || Number.isNaN(procedureId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid procedure ID',
    })
  }

  const body = await readBody(event)
  const { name, email, roleId } = body

  console.log('🔍 Assignment POST - Received body:', { name, email, roleId, roleIdType: typeof roleId })

  if (!name || !email || !roleId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: name, email, roleId',
    })
  }

  const db = useDrizzle()

  // Get the procedure to verify it exists and get organization
  const procedure = await db.query.procedures.findFirst({
    where: eq(tables.procedures.id, procedureId),
  })

  if (!procedure) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Procedure not found',
    })
  }

  // Check if user has permission to assign staff to procedures
  await requireOrganizationAccess(event, procedure.organizationId, 'procedures', 'assignStaff')

  // Get the role name for Keycloak mapping
  const role = await db.query.roles.findFirst({
    where: eq(tables.roles.id, roleId),
  })

  console.log('🔍 Found role in database:', role)

  if (!role) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid role ID',
    })
  }

  // Check if user exists by email
  let user = await db.query.users.findFirst({
    where: eq(tables.users.email, email),
  })

  // If user doesn't exist, create LOCAL account (NOT Keycloak)
  // Invited procedure members are NOT Keycloak users - they get local accounts only
  if (!user) {
    // Generate temporary password (user will set their own on first login)
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)

    // Create local user record (NO Keycloak)
    const [newUser] = await db.insert(tables.users).values({
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      authProvider: 'local', // Local auth, NOT Keycloak
      keycloakId: null, // NO Keycloak ID
      password: tempPassword, // TODO: Hash this password properly with bcrypt
      currentOrganizationId: procedure.organizationId,
    }).returning()

    user = newUser

    console.log(`✅ Created local user account for: ${email}`)
    console.log(`📧 TODO: Send email with temporary credentials: ${tempPassword}`)
    // TODO: Send email with temporary credentials and password reset link
  }

  // Check if user is already in the organization
  const existingUserOrg = await db.query.userOrganizations.findFirst({
    where: and(
      eq(tables.userOrganizations.userId, user.id),
      eq(tables.userOrganizations.organizationId, procedure.organizationId),
    ),
  })

  // If not in organization, add them with MEMBER base role
  // Invited users get "member" org role, NOT admin
  // Their actual working role is in procedureAssignments
  if (!existingUserOrg) {
    // Find the "member" role for invited users
    const memberRole = await db.query.roles.findFirst({
      where: eq(tables.roles.name, 'member'),
    })

    if (!memberRole) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Member role not found in database. Please run database seed.',
      })
    }

    await db.insert(tables.userOrganizations).values({
      userId: user.id,
      organizationId: procedure.organizationId,
      roleId: memberRole.id, // Use "member" base role for invited users
    })

    console.log(`✅ Added user to organization with base role: ${memberRole.name}`)
  }

  // Check if user is already assigned to this procedure
  const existingAssignment = await db.query.procedureAssignments.findFirst({
    where: and(
      eq(tables.procedureAssignments.procedureId, procedureId),
      eq(tables.procedureAssignments.userId, user.id),
    ),
  })

  if (existingAssignment) {
    throw createError({
      statusCode: 409,
      statusMessage: 'User is already assigned to this procedure',
    })
  }

  // Create the procedure assignment
  const [assignment] = await db.insert(tables.procedureAssignments).values({
    procedureId,
    userId: user.id,
    roleId,
  }).returning()

  // Fetch the complete assignment with relations
  const fullAssignment = await db.query.procedureAssignments.findFirst({
    where: eq(tables.procedureAssignments.id, assignment.id),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      role: {
        columns: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  })

  return fullAssignment
})

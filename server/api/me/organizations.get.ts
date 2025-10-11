import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Require authenticated user
  const session = await requireUserSession(event)
  const db = useDrizzle()

  // Get user with organizations
  const user = await db.query.users.findFirst({
    where: eq(tables.users.id, session.user.id),
    with: {
      userOrganizations: {
        with: {
          organization: true,
          role: true,
        },
      },
      currentOrganization: true,
    },
  })

  if (!user) {
    console.error('User not found in database. Session:', {
      userId: session.user.id,
      email: session.user.email,
      keycloakId: session.user.keycloakId,
    })
    throw createError({
      statusCode: 404,
      message: `User not found. Session user ID: ${session.user.id}`,
    })
  }

  return {
    organizations: user.userOrganizations.map(uo => ({
      id: uo.organization.id,
      name: uo.organization.name,
      slug: uo.organization.slug,
      role: uo.role.name,
    })),
    currentOrganization: user.currentOrganization ? {
      id: user.currentOrganization.id,
      name: user.currentOrganization.name,
      slug: user.currentOrganization.slug,
    } : null,
  }
})

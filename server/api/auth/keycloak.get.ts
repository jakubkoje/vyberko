import { eq } from 'drizzle-orm'

export default defineOAuthKeycloakEventHandler({
  async onSuccess(event, { user, tokens }) {
    const db = useDrizzle()

    // Get Keycloak user info
    const keycloakId = user.sub // Keycloak subject ID
    const email = user.email || user.preferred_username
    const name = user.name || user.preferred_username || email

    // Check if user exists in our database by keycloakId
    let dbUser = await db.query.users.findFirst({
      where: eq(tables.users.keycloakId, keycloakId),
      with: {
        userOrganizations: {
          with: {
            role: true,
            organization: true,
          },
        },
      },
    })

    // If not found by keycloakId, try by email (for migration scenarios)
    if (!dbUser && email) {
      dbUser = await db.query.users.findFirst({
        where: eq(tables.users.email, email),
        with: {
          userOrganizations: {
            with: {
              role: true,
              organization: true,
            },
          },
        },
      })

      // If found by email, link the Keycloak ID
      if (dbUser) {
        await db.update(tables.users)
          .set({
            keycloakId,
            authProvider: 'keycloak',
          })
          .where(eq(tables.users.id, dbUser.id))
      }
    }

    // If user still doesn't exist, create them (auto-provisioning)
    if (!dbUser) {
      // Get or create default organization
      let defaultOrg = await db.query.organizations.findFirst({
        where: eq(tables.organizations.slug, 'default'),
      })

      if (!defaultOrg) {
        ;[defaultOrg] = await db.insert(tables.organizations).values({
          name: 'Default Organization',
          slug: 'default',
        }).returning()
      }

      // Map Keycloak roles to VK roles
      const keycloakRoles = user.realm_access?.roles || []
      const vkRoleMapping: Record<string, string> = {
        admin: 'admin',
        gestor: 'subject_expert',
        committee: 'commission_member',
        subadmin: 'admin',
      }

      // Find matching VK role name
      let vkRoleName = 'admin' // Default role for staff
      for (const kcRole of keycloakRoles) {
        if (vkRoleMapping[kcRole]) {
          vkRoleName = vkRoleMapping[kcRole]
          break
        }
      }

      // Get the role from database
      const vkRole = await db.query.roles.findFirst({
        where: eq(tables.roles.name, vkRoleName),
      })

      if (!vkRole) {
        throw createError({
          statusCode: 500,
          message: `Role ${vkRoleName} not found in database`,
        })
      }

      // Create user with default organization
      const [newUser] = await db.insert(tables.users).values({
        keycloakId,
        email: email || `${keycloakId}@keycloak.local`,
        name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email || keycloakId}`,
        authProvider: 'keycloak',
        password: null,
        currentOrganizationId: defaultOrg.id,
      }).returning()

      // Link user to organization with role
      await db.insert(tables.userOrganizations).values({
        userId: newUser.id,
        organizationId: defaultOrg.id,
        roleId: vkRole.id,
      })

      dbUser = await db.query.users.findFirst({
        where: eq(tables.users.id, newUser.id),
        with: {
          userOrganizations: {
            with: {
              role: true,
              organization: true,
            },
          },
        },
      })
    }

    if (!dbUser) {
      throw createError({
        statusCode: 500,
        message: 'Failed to create or retrieve user',
      })
    }

    // Map Keycloak roles to VK roles
    const keycloakRoles = user.realm_access?.roles || []
    const vkRoleMapping: Record<string, string> = {
      admin: 'admin',
      gestor: 'subject_expert',
      committee: 'commission_member',
      subadmin: 'admin',
    }

    // Find matching VK role
    let vkRoleName = 'admin' // Default role for staff
    for (const kcRole of keycloakRoles) {
      if (vkRoleMapping[kcRole]) {
        vkRoleName = vkRoleMapping[kcRole]
        break
      }
    }

    // Set user session using nuxt-auth-utils
    await setUserSession(event, {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        avatar: dbUser.avatar,
        keycloakId: dbUser.keycloakId,
        role: vkRoleName,
        authProvider: 'keycloak',
      },
      loggedInAt: new Date().toISOString(),
    })

    // Redirect to admin dashboard
    return sendRedirect(event, '/admin')
  },

  onError(event, error) {
    console.error('Keycloak OAuth error:', error)
    return sendRedirect(event, '/auth/staff-login?error=keycloak_auth_failed')
  },
})

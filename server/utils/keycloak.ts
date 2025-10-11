/**
 * Keycloak Admin API Client
 * Manages user creation and role assignments in Keycloak
 */

interface KeycloakUser {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  enabled: boolean
}

interface CreateUserPayload {
  email: string
  name: string
  roleName: string // 'admin', 'gestor', 'committee'
}

/**
 * Get admin access token from Keycloak
 */
async function getAdminToken(): Promise<string> {
  const config = useRuntimeConfig()
  const tokenUrl = `${config.oauth.keycloak.serverUrl}/realms/${config.oauth.keycloak.realm}/protocol/openid-connect/token`

  // Use admin client if configured, otherwise fall back to main client
  const clientId = config.oauth.keycloak.adminClientId || config.oauth.keycloak.clientId
  const clientSecret = config.oauth.keycloak.adminClientSecret || config.oauth.keycloak.clientSecret

  if (!clientSecret) {
    throw createError({
      statusCode: 500,
      message: 'Keycloak admin client secret not configured. Please set NUXT_OAUTH_KEYCLOAK_ADMIN_CLIENT_SECRET environment variable.',
    })
  }

  try {
    const response = await $fetch<{ access_token: string }>(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    })

    return response.access_token
  }
  catch (error: any) {
    console.error('Failed to get Keycloak admin token:', error)
    throw createError({
      statusCode: 500,
      message: `Keycloak admin authentication failed. Please verify admin client configuration: ${error.message || 'Unknown error'}`,
    })
  }
}

/**
 * Create a new user in Keycloak with email verification
 */
export async function createKeycloakUser(payload: CreateUserPayload): Promise<string> {
  const config = useRuntimeConfig()
  const token = await getAdminToken()

  // Parse name into first and last name
  const nameParts = payload.name.trim().split(' ')
  const firstName = nameParts[0] || payload.name
  const lastName = nameParts.slice(1).join(' ') || ''

  const usersUrl = `${config.oauth.keycloak.serverUrl}/admin/realms/${config.oauth.keycloak.realm}/users`

  // Create user
  const createResponse = await $fetch(usersUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: {
      username: payload.email,
      email: payload.email,
      firstName,
      lastName,
      enabled: true,
      emailVerified: false,
      requiredActions: ['VERIFY_EMAIL', 'UPDATE_PASSWORD'], // User must verify email and set password
    },
    // Keycloak returns 201 with Location header containing user ID
    ignoreResponseError: true,
  })

  // Extract user ID from Location header or fetch by email
  const users = await $fetch<KeycloakUser[]>(`${usersUrl}?email=${encodeURIComponent(payload.email)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!users.length) {
    throw createError({
      statusCode: 500,
      message: 'Failed to create user in Keycloak',
    })
  }

  const userId = users[0].id

  // Assign realm role based on VK role
  const roleMapping: Record<string, string> = {
    admin: 'admin',
    subject_expert: 'gestor',
    commission_member: 'committee',
    commission_chair: 'committee',
  }

  const keycloakRole = roleMapping[payload.roleName] || 'committee'

  // Get role by name
  const rolesUrl = `${config.oauth.keycloak.serverUrl}/admin/realms/${config.oauth.keycloak.realm}/roles/${keycloakRole}`
  const role = await $fetch<{ id: string, name: string }>(rolesUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  // Assign role to user
  const userRolesUrl = `${usersUrl}/${userId}/role-mappings/realm`
  await $fetch(userRolesUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: [
      {
        id: role.id,
        name: role.name,
      },
    ],
  })

  // Send verification email
  const sendEmailUrl = `${usersUrl}/${userId}/send-verify-email`
  await $fetch(sendEmailUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    query: {
      client_id: config.oauth.keycloak.clientId,
      redirect_uri: `${config.oauth.keycloak.redirectURL || 'http://localhost:3000/auth/staff-login'}`,
    },
  })

  return userId
}

/**
 * Check if user exists in Keycloak by email
 */
export async function getKeycloakUserByEmail(email: string): Promise<KeycloakUser | null> {
  const config = useRuntimeConfig()
  const token = await getAdminToken()

  const usersUrl = `${config.oauth.keycloak.serverUrl}/admin/realms/${config.oauth.keycloak.realm}/users`
  const users = await $fetch<KeycloakUser[]>(`${usersUrl}?email=${encodeURIComponent(email)}&exact=true`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  return users.length > 0 ? users[0] : null
}

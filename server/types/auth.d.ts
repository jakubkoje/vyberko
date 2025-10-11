declare module '#auth-utils' {
  interface User {
    id: number
    email: string
    name: string
    avatar: string
    keycloakId?: string | null
    role: 'admin' | 'subject_expert' | 'commission_chair' | 'commission_member' | 'candidate'
    authProvider: 'keycloak' | 'local'
    contenderId?: number // Only for candidates
    procedureId?: number // Only for candidates
  }

  interface UserSession {
    user: User
    loggedInAt: string
  }

  interface SecureSessionData {
    // Add any sensitive data that should only be accessible server-side
  }
}

export {}

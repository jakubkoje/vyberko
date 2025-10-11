# Keycloak Authentication Integration

## Overview

This document describes the hybrid authentication system implemented for the Vyberko application using `nuxt-auth-utils` and Keycloak.

## Architecture

### Authentication Flows

**Staff Users (Admin, Subject Expert, Commission):**
- Login via Keycloak OAuth with 2FA support
- Uses Authorization Code Flow
- Redirects to Keycloak hosted UI
- Auto-provisions users on first login
- Role mapping from Keycloak to VK roles
- Permissions inferred from Keycloak role (not stored in database)

**Candidates:**
- Local authentication with temporary credentials
- Username: CIS identifier from CIS ŠS system
- Password: Temporary password set by admin
- No self-registration
- Session-based authentication

### Role Definitions

**Admin (Tajomník VK):**
- Creates accounts for vecný gestor, commission members, and candidates
- Defines and manages recruitment procedures (výberové konanie) in the system
- Creates procedures with predefined headers
- Creates and assigns tests to procedures
- Sets testing conditions (scope, time limits, points, correct answers)
- Imports documents from SharePoint for candidate storage
- Makes test templates available to subject experts
- Can also create tests/quizzes with save, duplicate, and edit capabilities
- Views procedure status (registered candidates, open tests, timer, interim results)
- Predefines evaluation environment for commission (abilities, personality traits, questions, evaluation sheets)
- Exports results to documentation and sends PDF via email
- Requires 2FA authentication

**Vecný gestor (Subject Expert):**
- Creates professional knowledge tests (ODBORNÝ TEST ONLY) based on Admin-provided templates
- Works primarily with quiz-format tests (3 answers, 1 correct)
- Can save, duplicate, and edit tests
- Cannot create other test types (general knowledge, language, etc.)

**Predseda komisie (Commission Chair):**
- Leads the evaluation commission
- Reviews candidate materials from storage (CV, certificates, motivation letters)
- Views all test results and errors for each test
- Evaluates oral exams by assigning points (1-5 scale) to predefined abilities and personality traits
- Views predefined battery of questions for oral evaluation
- Can finalize evaluations

**Člen komisie (Commission Member):**
- Can log into system and open specific procedures
- Opens candidate folders to review
- Views documents in storage (CV, motivation letters, certificates)
- Views test results and detailed errors from written exams
- Sees predefined abilities and personality traits for evaluation
- Views battery of oral exam questions
- Assigns points to each ability and personality trait during oral evaluation
- Submits evaluations

**Uchádzač (Candidate):**
- Takes assigned tests within specified time limits
- Views own test results
- Limited access to only their own procedure and materials

## Configuration

### Environment Variables

```env
# Keycloak OAuth (Public Client for User Login)
NUXT_OAUTH_KEYCLOAK_CLIENT_ID=vyberko-app
NUXT_OAUTH_KEYCLOAK_SERVER_URL=https://keycloak.pucwoll.dev
NUXT_OAUTH_KEYCLOAK_REALM=master
NUXT_OAUTH_KEYCLOAK_REDIRECT_URL=http://localhost:3000/api/auth/keycloak

# Keycloak Admin Client (Confidential Client for User Management)
NUXT_OAUTH_KEYCLOAK_ADMIN_CLIENT_ID=vyberko-admin
NUXT_OAUTH_KEYCLOAK_ADMIN_CLIENT_SECRET=your-admin-client-secret-here

# Session Secret (32+ characters)
NUXT_SESSION_PASSWORD=vyberko-secret-session-password-min-32-chars-required-for-security
```

### Keycloak Configuration

**1. Public Client for User Login (`vyberko-app`):**
- Client ID: `vyberko-app`
- Client Type: **Public**
- Valid Redirect URIs: `http://localhost:3000/api/auth/keycloak/*`, `https://your-production-url.com/api/auth/keycloak/*`
- Web Origins: `http://localhost:3000`, `https://your-production-url.com`

**2. Admin Client for User Management (`vyberko-admin`):**
- Client ID: `vyberko-admin`
- Client Type: **Confidential**
- Service Accounts Enabled: **ON**
- Authorization Enabled: **ON**
- Valid Redirect URIs: Not required (service account only)
- **Service Account Roles (Required):**
  1. Go to "Service Account Roles" tab
  2. Assign Client Role: `realm-management` → `manage-users`
  3. Assign Client Role: `realm-management` → `view-users`
  4. Assign Client Role: `realm-management` → `manage-realm` (for role management)
- **Copy the Client Secret** from the Credentials tab and add to `.env` as `NUXT_OAUTH_KEYCLOAK_ADMIN_CLIENT_SECRET`

**Realm Roles → VK Role Mapping:**
- `admin` → `admin`
- `gestor` → `subject_expert`
- `committee` → `commission_member`
- `subadmin` → `admin`

**2FA Configuration:**
- Enable "Configure OTP" required action for admin users
- Supported: TOTP (Google Authenticator, FreeOTP, Microsoft Authenticator)

## Database Schema

### New Fields in `users` Table

```sql
keycloakId TEXT UNIQUE          -- Keycloak user ID (sub claim)
authProvider TEXT DEFAULT 'local' -- 'keycloak' or 'local'
password TEXT NULLABLE          -- NULL for Keycloak users
```

## API Endpoints

### Staff Login (Keycloak)

**Endpoint:** `GET /api/auth/keycloak`

Initiates OAuth flow, redirects to Keycloak login page.

**Flow:**
1. User clicks "Login with Keycloak"
2. Redirects to Keycloak hosted UI
3. User authenticates (with 2FA if enabled)
4. Callback to `/api/auth/keycloak?code=...`
5. Exchanges code for tokens
6. Fetches user info
7. Creates/updates user in local DB
8. Sets session
9. Redirects to `/admin`

### Candidate Login (Local)

**Endpoint:** `POST /api/auth/local`

**Request Body:**
```json
{
  "cisIdentifier": "CIS-2025-001",
  "password": "temporary-password"
}
```

**Response:**
```json
{
  "success": true,
  "redirectTo": "/procedure/1/test"
}
```

### Logout

**Endpoint:** `POST /api/auth/logout`

Clears user session.

## Frontend

### Login Pages

**Staff Login:** `/auth/staff-login`
- Single button redirects to Keycloak

**Candidate Login:** `/auth/candidate-login`
- Form with CIS identifier and password

### Session Management

Use the `useUserSession()` composable:

```vue
<script setup>
const { loggedIn, user, session, fetch, clear } = useUserSession()
</script>

<template>
  <div v-if="loggedIn">
    <p>Welcome {{ user.name }}!</p>
    <p>Role: {{ user.role }}</p>
    <button @click="clear">Logout</button>
  </div>
</template>
```

### Auth Middleware

Applied globally to protect routes.

**Public routes:**
- `/auth/staff-login`
- `/auth/candidate-login`

**Protected routes:**
- `/admin/*` - Staff only
- `/procedure/:id/test` - Candidates only (own procedure)

## User Session Type

```typescript
interface User {
  id: number
  email: string
  name: string
  avatar: string
  keycloakId?: string | null
  role: 'admin' | 'subject_expert' | 'commission_chair' | 'commission_member' | 'candidate'
  authProvider: 'keycloak' | 'local'
  contenderId?: number // Candidates only
  procedureId?: number // Candidates only
}

interface UserSession {
  user: User
  loggedInAt: string
}
```

## User Management

### Creating Staff Users

1. Admin creates user in Keycloak admin panel
2. Assigns appropriate realm role (`admin`, `gestor`, `committee`)
3. Optionally requires 2FA (Configure OTP)
4. Keycloak sends invitation email
5. User logs in via `/auth/staff-login`
6. Auto-provisioned in local DB on first login

### Creating Candidate Users

1. Admin creates contender in VK system with CIS identifier
2. Admin creates user account:
```typescript
const hashedPassword = await hashPassword('temp-password-123')

await db.insert(tables.users).values({
  name: 'Candidate Name',
  email: 'candidate@example.com',
  password: hashedPassword,
  authProvider: 'local',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=candidate',
})

// Link to contender
await db.update(tables.contenders)
  .set({ userId: newUser.id })
  .where(eq(tables.contenders.cisIdentifier, 'CIS-2025-001'))
```
3. Admin sends CIS identifier and password to candidate
4. Candidate logs in via `/auth/candidate-login`

## Security Features

- ✅ Sealed & secure cookie sessions (nuxt-auth-utils)
- ✅ Password hashing with scrypt
- ✅ 2FA support via Keycloak
- ✅ Role-based access control
- ✅ Session expiration
- ✅ CSRF protection
- ✅ Separate authentication flows for staff vs. candidates

## Testing

### Test Staff Login

1. Go to `http://localhost:3000/auth/staff-login`
2. Click "Login with Keycloak"
3. Login with Keycloak credentials: `gigaboss@pucwoll.dev` / `gigaboss123`
4. Should redirect to `/admin`

### Test Candidate Login

1. Create a test candidate with `hashPassword()`
2. Go to `http://localhost:3000/auth/candidate-login`
3. Enter CIS identifier and password
4. Should redirect to procedure test page

## Troubleshooting

### "Invalid credentials" error
- Verify Keycloak config in `.env`
- Check client ID matches Keycloak
- Verify redirect URLs in Keycloak client settings

### User not auto-provisioned
- Check Keycloak role mappings
- Verify user has realm roles assigned
- Check server logs for errors

### Session not persisting
- Verify `NUXT_SESSION_PASSWORD` is set (32+ chars)
- Check cookie settings in browser
- Verify HTTPS in production

## Production Checklist

- [ ] Update redirect URLs in Keycloak client
- [ ] Set production `NUXT_OAUTH_KEYCLOAK_REDIRECT_URL`
- [ ] Generate strong `NUXT_SESSION_PASSWORD`
- [ ] Enable 2FA for all admin users in Keycloak
- [ ] Restrict Keycloak redirect URIs (no wildcards)
- [ ] Configure session timeout in `nuxt.config.ts`
- [ ] Set up HTTPS
- [ ] Configure CORS properly
- [ ] Audit Keycloak role assignments
- [ ] Test password reset flows

## Future Enhancements

- [ ] Add "Remember Me" functionality
- [ ] Implement refresh token rotation
- [ ] Add audit logging for auth events
- [ ] Support multiple organizations per user
- [ ] Add email verification for new users
- [ ] Implement session timeout warnings
- [ ] Add brute force protection
- [ ] Support Keycloak themes customization

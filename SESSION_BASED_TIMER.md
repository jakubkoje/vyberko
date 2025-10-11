# Session-Based Timer - Persistent Across Page Refreshes

## Overview

The timer system now uses **persistent session dates** from the backend, ensuring that the timer doesn't reset when the page is refreshed. The `startDate` and `endDate` are stored per access code and remain consistent throughout the test session.

## How It Works

### 1. Session Creation (First Access)

When a user first accesses the test with an access code:

```typescript
// User visits: /test?code=TEST123

// Backend creates session:
{
  code: "TEST123",
  startDate: "2025-10-11T10:00:00Z",
  endDate: "2025-10-11T10:15:00Z"  // 15 minutes later
}

// Timer shows: 15:00
```

### 2. Page Refresh (Same Session)

When the user refreshes the page:

```typescript
// User refreshes at 10:05 AM

// Backend returns SAME dates:
{
  startDate: "2025-10-11T10:00:00Z",
  endDate: "2025-10-11T10:15:00Z"
}

// Timer shows: 10:00 (not 15:00!)
// Correctly calculates: endDate - now
```

### 3. Browser Close and Reopen

```typescript
// User closes browser at 10:07 AM
// User reopens at 10:10 AM

// Backend returns SAME dates:
{
  startDate: "2025-10-11T10:00:00Z",
  endDate: "2025-10-11T10:15:00Z"
}

// Timer shows: 5:00 (not 15:00!)
// Only 5 minutes remaining
```

## Implementation

### Backend API (`server/api/test/configuration.get.ts`)

```typescript
// In-memory session storage (demo)
// In production: use database
const testSessions = new Map<string, { 
  startDate: string
  endDate: string 
}>()

export default defineEventHandler(async (event) => {
  const { code } = getQuery(event)
  
  // Check if session exists
  let sessionDates = testSessions.get(code)
  
  if (!sessionDates) {
    // New session - create dates
    const now = new Date()
    const duration = 900 // 15 minutes
    const endDate = new Date(now.getTime() + duration * 1000)
    
    sessionDates = {
      startDate: now.toISOString(),
      endDate: endDate.toISOString()
    }
    
    // Store for future requests
    testSessions.set(code, sessionDates)
  }
  
  // Return same dates every time
  return {
    title: "Test",
    showTimer: true,
    startDate: sessionDates.startDate,
    endDate: sessionDates.endDate,
    pages: [...]
  }
})
```

### Frontend (`app/pages/test.vue`)

```typescript
const fetchTestConfiguration = async () => {
  const response = await $fetch('/api/test/configuration', {
    query: { code: code.value }
  })
  
  // Use dates from backend (not calculated!)
  if (response.startDate && response.endDate) {
    startDate.value = response.startDate
    endDate.value = response.endDate
  }
}
```

### CustomPreview Component

```typescript
// Calculates remaining time based on absolute dates
const calculateTimeRemaining = () => {
  const now = new Date()
  const end = new Date(props.endDate)
  const diffMs = end.getTime() - now.getTime()
  return Math.floor(diffMs / 1000)
}

// Updates every second
setInterval(() => {
  timeRemaining.value = calculateTimeRemaining()
}, 1000)
```

## Session Storage

### Current (Demo): In-Memory Map

```typescript
const testSessions = new Map<string, SessionData>()

// Pros:
// ✅ Simple implementation
// ✅ Works for single server

// Cons:
// ❌ Lost on server restart
// ❌ Doesn't work with multiple servers
// ❌ Not persistent
```

### Production: Database

```sql
CREATE TABLE test_sessions (
  id UUID PRIMARY KEY,
  access_code VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID,
  test_id UUID,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  
  INDEX idx_access_code (access_code),
  INDEX idx_end_date (end_date)
);
```

```typescript
// Production implementation
const session = await db.query.testSessions.findFirst({
  where: eq(testSessions.accessCode, code)
})

if (!session) {
  // Create new session
  const now = new Date()
  const endDate = new Date(now.getTime() + duration * 1000)
  
  await db.insert(testSessions).values({
    accessCode: code,
    startDate: now,
    endDate: endDate
  })
}

return {
  startDate: session.startDate.toISOString(),
  endDate: session.endDate.toISOString()
}
```

## Testing

### Test Scenario 1: Normal Flow

```bash
# 1. Start test
curl http://localhost:3001/api/test/configuration?code=TEST123

Response:
{
  "startDate": "2025-10-11T10:00:00Z",
  "endDate": "2025-10-11T10:15:00Z"
}

# 2. Refresh after 5 minutes
curl http://localhost:3001/api/test/configuration?code=TEST123

Response (SAME DATES):
{
  "startDate": "2025-10-11T10:00:00Z",
  "endDate": "2025-10-11T10:15:00Z"
}

# Timer shows: 10:00 (not 15:00) ✅
```

### Test Scenario 2: Different Users

```bash
# User 1
curl http://localhost:3001/api/test/configuration?code=USER1

Response:
{
  "startDate": "2025-10-11T10:00:00Z",
  "endDate": "2025-10-11T10:15:00Z"
}

# User 2 (different code, different session)
curl http://localhost:3001/api/test/configuration?code=USER2

Response (DIFFERENT DATES):
{
  "startDate": "2025-10-11T10:05:00Z",
  "endDate": "2025-10-11T10:20:00Z"
}

# Each user has independent timer ✅
```

### Test Scenario 3: Server Restart

```bash
# Note: In-memory storage is lost on restart
# In production with database, sessions persist

# Before restart
code=TEST123 → startDate: 10:00, endDate: 10:15

# After restart (in-memory)
code=TEST123 → NEW startDate: 10:30, endDate: 10:45

# After restart (database)
code=TEST123 → SAME startDate: 10:00, endDate: 10:15 ✅
```

## Visual Test in Browser

### Before Fix:
```
1. Visit: http://localhost:3001/test?code=TEST123
   Timer shows: 15:00

2. Wait 5 minutes
   Timer shows: 10:00

3. Refresh page
   Timer shows: 15:00 ❌ (WRONG - timer reset!)
```

### After Fix:
```
1. Visit: http://localhost:3001/test?code=TEST123
   Timer shows: 15:00
   Console: "Created new test session for code: TEST123"

2. Wait 5 minutes
   Timer shows: 10:00

3. Refresh page
   Timer shows: 10:00 ✅ (CORRECT - timer persists!)
   Console: "Retrieved existing test session for code: TEST123"
```

## Console Logs

### New Session
```
GET /api/test/configuration?code=TEST123
Created new test session for code: TEST123 {
  startDate: '2025-10-11T10:00:00.000Z',
  endDate: '2025-10-11T10:15:00.000Z'
}

Frontend:
Using dates from backend: {
  start: '2025-10-11T10:00:00.000Z',
  end: '2025-10-11T10:15:00.000Z'
}
```

### Existing Session
```
GET /api/test/configuration?code=TEST123
Retrieved existing test session for code: TEST123 {
  startDate: '2025-10-11T10:00:00.000Z',
  endDate: '2025-10-11T10:15:00.000Z'
}

Frontend:
Using dates from backend: {
  start: '2025-10-11T10:00:00.000Z',
  end: '2025-10-11T10:15:00.000Z'
}
```

## Key Changes

### ✅ `server/api/test/configuration.get.ts`
- Added in-memory session storage
- Creates session on first access
- Returns same dates on subsequent calls
- Console logs for debugging

### ✅ `app/pages/test.vue`
- Uses `startDate` and `endDate` from backend
- Removed client-side date calculation
- Added console logs for debugging
- Fallback for backwards compatibility

### ✅ `app/components/survey/CustomPreview.vue`
- Already calculates time from absolute dates
- No changes needed!

## Migration to Database

### Step 1: Create Schema

```typescript
// server/database/schema.ts
export const testSessions = pgTable('test_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  accessCode: varchar('access_code', { length: 50 }).unique().notNull(),
  userId: uuid('user_id'),
  testId: uuid('test_id'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  submittedAt: timestamp('submitted_at'),
  createdAt: timestamp('created_at').defaultNow()
})
```

### Step 2: Update API

```typescript
export default defineEventHandler(async (event) => {
  const { code } = getQuery(event)
  
  // Get or create session
  let session = await db.query.testSessions.findFirst({
    where: eq(testSessions.accessCode, code)
  })
  
  if (!session) {
    const now = new Date()
    const endDate = new Date(now.getTime() + 900000)
    
    const [newSession] = await db.insert(testSessions)
      .values({
        accessCode: code,
        startDate: now,
        endDate: endDate
      })
      .returning()
    
    session = newSession
  }
  
  return {
    title: "Test",
    startDate: session.startDate.toISOString(),
    endDate: session.endDate.toISOString(),
    pages: [...]
  }
})
```

### Step 3: Run Migration

```bash
pnpm db:generate
pnpm db:migrate
```

## Security Considerations

### ✅ Server-Side Authority
- Dates controlled by server
- Client cannot manipulate
- Consistent across sessions

### ✅ Session Isolation
- Each access code = separate session
- No cross-contamination
- Independent timers

### ✅ Expiration Handling
```typescript
// Check if session expired
const now = new Date()
const endDate = new Date(session.endDate)

if (now > endDate) {
  throw createError({
    statusCode: 403,
    message: 'Test session has expired'
  })
}
```

## Troubleshooting

### Timer Resets on Refresh

**Cause**: Backend generating new dates each time

**Fix**: Ensure session storage is working
```typescript
// Check console logs
"Created new test session" // First time only
"Retrieved existing test session" // On refresh
```

### Timer Shows Wrong Time

**Cause**: Timezone issues

**Fix**: Always use ISO 8601 with UTC
```typescript
const date = new Date()
date.toISOString() // "2025-10-11T10:00:00.000Z"
```

### Session Lost on Server Restart

**Cause**: Using in-memory storage

**Fix**: Migrate to database storage

## Summary

### Benefits

1. **✅ Persistent Timer**: Works across refreshes
2. **✅ Accurate**: Based on server time
3. **✅ Secure**: Cannot be manipulated
4. **✅ Fair**: All users get same duration
5. **✅ Scalable**: Ready for database

### Files Modified

- ✅ `server/api/test/configuration.get.ts` - Session storage
- ✅ `app/pages/test.vue` - Use backend dates
- ✅ `app/components/survey/CustomPreview.vue` - Already correct!

### Next Steps

1. Add database schema for sessions
2. Implement session cleanup (expired tests)
3. Add session analytics
4. Monitor timer accuracy

## Support

For questions about session-based timer:
- See `TIMER_INTEGRATION.md` for timer basics
- See `TEST_SYSTEM.md` for system overview
- Contact: podpora@vyberko.sk


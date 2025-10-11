# Permission System Fixes

## ✅ Fixed Critical Bugs

### 1. Hardcoded User IDs
**Problem**: Two functions in `server/utils/organization.ts` had hardcoded `userId = 1`:
- `getCurrentUser()` - Line 66
- `requireOrganizationAccess()` - Line 105

**Impact**:
- All users were treated as user ID 1 (admin)
- Subject experts could see ALL procedures instead of just assigned ones
- Permission checks were not working correctly

**Fix**:
- Updated both functions to get actual user ID from session: `session.user.id`
- Now properly enforces role-based access control

### 2. Missing UI Permission Checks
**Problem**: UI components weren't checking permissions before showing actions

**Fixes Applied**:

#### Procedures Page ([app/pages/admin/procedures/index.vue](app/pages/admin/procedures/index.vue))
- ✅ "New Procedure" button now hidden for non-admins
- ✅ Added `usePermissions()` composable
- ✅ Only shows if `can('procedures', 'create')`

#### Procedure Settings ([app/pages/admin/procedures/[id]/settings.vue](app/pages/admin/procedures/[id]/settings.vue))
- ✅ Edit procedure: `can('procedures', 'update')`
- ✅ Assign/remove staff: `can('procedures', 'assignStaff')`
- ✅ Manage exam criteria: `can('evaluation', 'defineAbilities')`
- ✅ Manage surveys: `can('procedures', 'manageTests')`
- ✅ Delete procedure: `can('procedures', 'delete')`

#### Surveys Page ([app/pages/admin/surveys/index.vue](app/pages/admin/surveys/index.vue))
- ✅ Create button: Only if `can('surveys', 'create')` or similar
- ✅ Edit: `can('surveys', 'update')`
- ✅ Duplicate: `can('surveys', 'duplicate')`
- ✅ Delete: `can('surveys', 'delete')`

## 🔒 How Permissions Work Now

### Subject Expert (Gestor)
- ✅ **Cannot** see procedures they're not assigned to
- ✅ **Cannot** create new procedures
- ✅ **Can** see assigned procedures only (backend filters via JOIN on `procedureAssignments`)
- ✅ **Can** create ONLY professional knowledge surveys
- ✅ **Can** edit and duplicate surveys

### Admin
- ✅ Sees ALL procedures in their organization
- ✅ Can create/edit/delete everything
- ✅ Full access to all features

### Commission (Chair & Member)
- ✅ See only assigned procedures (filtered by backend)
- ✅ Cannot create or edit procedures
- ✅ Can view candidate documents
- ✅ Chair can finalize evaluations, members cannot

### Candidate
- ✅ Can only view own results
- ✅ No admin panel access (separate interface)

## 🔍 Backend Permission Flow

1. **Session Check**: `requireUserSession(event)` → Gets authenticated user
2. **User Lookup**: `getCurrentUser(event)` → Gets user from DB using session user ID
3. **Organization Check**: `requireOrganizationAccess(event, orgId, resource, action)`
   - Gets user's role in organization
   - Calls `hasPermission(roleName, resource, action)`
   - Throws 403 if no permission
4. **Data Filtering**:
   - Admin: Gets all data in organization
   - Others: JOIN with `procedureAssignments` to filter by assigned procedures

## 📝 Testing Checklist

### As Subject Expert:
- [ ] Can only see assigned procedures (not all procedures)
- [ ] "New Procedure" button is hidden
- [ ] Cannot access procedure creation modal
- [ ] Can see surveys to create professional tests
- [ ] Can edit own surveys
- [ ] Cannot delete surveys

### As Commission Member:
- [ ] Can only see assigned procedures
- [ ] Can view candidate documents in assigned procedures
- [ ] Can assign evaluation points
- [ ] Cannot finalize evaluations (only chair can)
- [ ] Cannot create or edit procedures

### As Commission Chair:
- [ ] Same as member PLUS
- [ ] Can finalize evaluations

### As Admin:
- [ ] Can see all procedures
- [ ] Can create/edit/delete procedures
- [ ] Can assign staff
- [ ] Can manage all aspects

## 🚨 Remaining Considerations

### Surveys Visibility
Currently ALL users with `surveys.read` permission can see all surveys in their organization. This includes:
- Admin ✅ (needs to see all)
- Gestor ✅ (needs to see surveys to create professional tests from)
- Commission ✅ (needs to see surveys to evaluate)
- Candidate ⚠️ (should only see assigned surveys - but candidates shouldn't access admin panel)

**Recommendation**: Candidates should have a separate interface, not access to admin panel.

### Survey Creation for Gestor
Gestor has `createProfessional: true` but UI doesn't filter categories yet. Need to:
- Show only "Professional Knowledge" category option when gestor creates survey
- Hide other categories in CreateSurveyModal for gestor role

This is tracked in [REQUIREMENTS_TODO.md](REQUIREMENTS_TODO.md) #12.

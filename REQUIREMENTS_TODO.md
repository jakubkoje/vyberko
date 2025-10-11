# Requirements That Need Backend Implementation

This document lists requirements from CLAUDE.md that cannot be satisfied by just changing access controls. These require actual features to be implemented.

## ✅ Completed (Access Control Only)

These have been implemented through the permission system:

### Admin (Tajomník VK)
- ✅ Create procedures (can create)
- ✅ Assign staff to procedures (can assignStaff)
- ✅ Create/edit/duplicate/delete tests (full survey permissions)
- ✅ Delete procedures (can delete)

### Subject Expert (Vecný gestor)
- ✅ ONLY create professional knowledge tests (createProfessional only)
- ✅ Duplicate tests (can duplicate)
- ✅ Edit own tests (can update)
- ✅ Cannot create other test types (all other create permissions false)

### Commission (Chair & Members)
- ✅ View procedures they're assigned to (can read)
- ✅ View candidate documents/storage (can view storage)
- ✅ View test results and errors (can viewTestErrors)
- ✅ Assign points during evaluation (can assignPoints)
- ✅ **Chair only**: Finalize evaluations (chair has finalize, member does not)

### Candidate (Uchádzač)
- ✅ View own results only (can viewResults but scoped to own procedure)

---

## ❌ Requires Backend Features

These requirements need actual functionality to be built:

### 1. Procedure Header System
**Requirement**: "Vytvoriť konkrétne výberové konanie s preddefinovanou HLAVIČKOU"

**Status**: ❌ Not implemented

**What's needed**:
- Predefined header fields already in schema: `procedureType`, `organizational Unit`, `civilServiceSector`, `positionTitle`, `serviceType`, `procedureDate`, `numberOfPositions`
- Need UI form/modal to collect these during procedure creation
- Need validation to ensure header is filled

### 2. SharePoint Integration
**Requirement**: "Importovať zo SharePointu potrebné podklady"

**Status**: ❌ Not implemented

**What's needed**:
- SharePoint API integration
- File import mechanism
- Storage mapping (already have `contenderFiles` table with `sharepointId` field)
- Permission check already in place: `can('procedures', 'importSharePoint')`

### 3. Template System
**Requirement**: "Sprístupniť vecnému gestorovi pripravené šablóny na vytvorenie testov"

**Status**: ❌ Not implemented

**What's needed**:
- Survey templates table/system
- Template creation UI (admin only)
- Template selection UI when gestor creates professional tests
- Permission checks already in place: `can('templates', 'provide')` and `can('templates', 'read')`

### 4. Test Conditions Management
**Requirement**: "Nastaviť podmienky testovania. Definovať rozsah testu, časové rozpätie, definovať pridelené body, definovať správne odpovede"

**Status**: ❌ Not implemented

**What's needed**:
- Test configuration fields in `procedureSurveys` table: `timeLimit`, `totalPoints`, `passingScore`
- UI for admin to configure these settings per procedure-survey assignment
- Permission check already in place: `can('procedures', 'manageTests')`

### 5. Live Statistics Dashboard
**Requirement**: "Vidieť počas realizácie VK - počet prihlásených uchádzačov na danom VK, otvorené testy, časovač a aj priebežné výsledky"

**Status**: ❌ Not implemented

**What's needed**:
- Real-time dashboard showing:
  - Count of registered candidates
  - Which tests are currently active/open
  - Timer for active tests
  - Interim results/statistics
- Permission check already in place: `can('procedures', 'viewLiveStats')`
- Consider WebSocket/SSE for real-time updates

### 6. Question Battery System
**Requirement**: "vybrať z databázy otázky, definovať položky hodnotiaceho hárku"

**Status**: ❌ Not implemented

**What's needed**:
- Question bank/database table
- UI for admin to select questions for evaluation
- Evaluation sheet definition
- Permission checks already in place: `can('evaluation', 'defineQuestions')`

### 7. Oral Exam Evaluation Interface
**Requirement**: "Prideliť počet bodov, ku každej schopnosti a osobnostnej vlastnosti"

**Status**: ❌ Partially implemented

**What's currently done**:
- Database tables: `examCriteria`, `examScores`
- Ability to add/remove criteria to procedures
- Permission checks: `can('evaluation', 'assignPoints')`

**What's still needed**:
- UI for commission to assign points (1-5 scale) to each ability/trait
- Interface to view battery of questions during evaluation
- Real-time scoring interface

### 8. Document Export & Email
**Requirement**: "Spustiť prenos výsledkov do pripravenej dokumentácie a odoslať si na e-mail pdf verzie"

**Status**: ❌ Not implemented

**What's needed**:
- PDF generation from results
- Email sending capability (SMTP configuration)
- Documentation template system
- Export trigger UI
- Permission check already in place: `can('procedures', 'finalizeDocumentation')`

### 9. Gestor Test Approval Workflow
**Requirement**: "Tvorí testy a odovzdáva ich na schválenie Adminovi"

**Status**: ❌ Not implemented

**What's needed**:
- Test status system (draft/pending_approval/approved/rejected)
- Approval workflow UI for admin
- Notification system for approval requests
- Currently gestor can create tests but no approval workflow

### 10. Account Creation for Candidates
**Requirement**: "Vytvoriť jednotlivé účty (vecného gestora, komisie, aj prihlásených uchádzačov)"

**Status**: ⚠️ Partially implemented

**What's currently done**:
- Staff (gestor, commission) can be invited via Keycloak with email
- Permission: `can('users', 'createStaff')`

**What's still needed**:
- Dedicated UI for creating candidate accounts with temporary passwords
- No Keycloak for candidates - local auth only
- Automatic account creation when adding contender
- Permission already in place: `can('users', 'createCandidates')`

### 11. Test Attempt Tracking & Timer
**Requirement**: Candidates take tests within time limits, timer enforcement

**Status**: ❌ Not implemented

**What's needed**:
- Test attempt tracking (start time, end time, elapsed time)
- Client-side timer with server validation
- Auto-submit when time expires
- Prevent re-taking completed tests

### 12. Category-based Test Filtering for Gestor
**Requirement**: Gestor can ONLY create "ODBORNÝ TEST" (professional knowledge)

**Status**: ✅ Permission implemented, ❌ UI enforcement needed

**What's currently done**:
- Permission system restricts gestor to `createProfessional` only

**What's still needed**:
- UI should filter test categories to show only "professional_knowledge" option when gestor creates test
- Hide other category options in CreateSurveyModal for gestor role

---

## Summary

**Permissions implemented**: 14/14 ✅
**Features requiring development**: 12
**Access control complete**: Yes
**Backend work needed**: Significant

The permission system is now fully aligned with requirements. Next steps should focus on implementing the actual features listed above.

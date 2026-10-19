# CLAUDE.md — Agent & Developer Operating Instructions

## 1. Project Purpose & Scope

**ClaimIt** is a campus lost-and-found web application built for University of Caloocan City (UCC) students, faculty, and administrative staff. The platform enables users to report lost and found items, browse catalogued belongings, submit verification claims and item matches, and manage their campus identities.

This workspace specifically implements **Backend 1: ROVIC**, which is responsible for:
- User registration (Student and Faculty workflows)
- Faculty registration approval lifecycle
- Login, session management, and logout
- Supabase Auth integration and state persistence
- Password recovery and reset flows
- Role-based authorization (Student, Faculty, Admin)
- User profiles and profile photo storage
- Profile settings and self-service password updates
- Administrative user management (view, filter, search, edit, suspend, deactivate, reactivate)
- Administrative account creation and temporary password generation
- Account-related admin dashboard metrics and recent account feeds

---

## 2. Reading Order & Prerequisites

Before modifying or creating any code in subsequent prompts, the developer or AI agent **MUST** read and reconcile:
1. `PRODUCT.md` — Functional specifications, role definitions, and business rules.
2. `DESIGN.md` — Visual language, layout hierarchy, component tokens, and modal specifications.
3. `ARCHITECTURE.md` — System architecture, database schema, RLS policies, auth flows, and module inventory.
4. `README.md` — Setup, local execution, environment variables, and Free-plan constraints.

---

## 3. Frontend Preservation Rules

1. **Zero Unapproved Redesign**: Do not modify UI layouts, color palettes, fonts, spacing, or modal transitions. Retain the existing design tokens (e.g., `#5170ff` brand blue, `#23261F` dark neutral, `#E8E4D8` borders, `#f8f9ff` canvas).
2. **Preserve Component Contracts**: All props (`isOpen`, `onClose`, `onSubmit`, `onLogout`, `user`, `account`, etc.) must remain backward-compatible.
3. **No Duplicate Components**: Never introduce duplicate versions of existing components (such as duplicate login or registration forms). Integrate state and Supabase client hooks directly into existing discovery targets.
4. **Tailwind CDN / Styling Preservation**: Maintain the current Tailwind utility classes and fonts (`Inter`, `Plus Jakarta Sans`, and `Material Symbols Outlined`). Do not introduce extraneous CSS files or UI frameworks (e.g., Bootstrap, MUI, Chakra).

---

## 4. Backend 1 Integration Boundaries & Untouched Modules

### Strictly Owned by Backend 1 (ROVIC):
- `client/src/components/auth/*` (`Login.jsx`, `RegFormStudent.jsx`, `RegFormFaculty.jsx`, `AuthFlow.jsx`, `ForgotPassword.jsx`, `VerifyCode.jsx`, `ResetPassword.jsx`, `PasswordResetSuccess.jsx`)
- `client/src/components/user/ProfileSettings.jsx`
- `client/src/components/admin/pages/AdminProfileSettings.jsx`
- `client/src/components/admin/pages/UserManagement.jsx`
- `client/src/components/admin/pages/Dashboard.jsx` (account metrics and recent accounts table only)
- `client/src/components/admin/modals/AddAccountModal.jsx`
- `client/src/components/admin/modals/AdminAccountModals.jsx`
- `client/src/components/admin/modals/UserAccountModals.jsx`
- `client/src/components/shared/UserProfileModal.jsx`
- `client/src/components/shared/LogoutConfirmation.jsx`
- Supabase client initialization, migrations, and schema definition

### Explicitly Excluded (Do NOT touch without explicit approval):
- Lost-item and found-item report creation, editing, or viewing (`MyReports.jsx`, `AddReportItem.jsx`, `ReportDetailsModal.jsx`, etc.)
- Browse items catalog (`BrowseItems.jsx`, `BrowseItemDetailsModal.jsx`, `ItemCard.jsx`, etc.)
- Claims and match verification (`ClaimsAndMatches.jsx`, `ClaimMatchDetailsModal.jsx`, `WithdrawClaimMatchModal.jsx`, etc.)
- Peer-to-peer messaging and conversations (`ConversationMessage.jsx`, `ClaimMatchMessageModal.jsx`, etc.)
- In-app notification center (`Notifications.jsx`)
- Item taxonomy and categories (`ManageLists.jsx`, `AddModalManageLists.jsx`, etc.)
- System-wide activity logs owned by item management (`ActivityLogs.jsx`)
- Admin reports overview (`ReportsAdmin.jsx`)

---

## 5. Supabase Implementation Conventions

1. **Free-Plan Compliance**: Use standard Supabase features:
   - Supabase Auth (`email` + `password` provider)
   - Supabase PostgreSQL with Row Level Security (RLS)
   - Supabase Storage (`avatars` bucket with public read and authenticated owner write)
   - `@supabase/supabase-js` client SDK
2. **Migrations in Git**: All schema definitions, table modifications, and RLS policies must be committed as idempotent SQL scripts under `supabase/migrations/`.
3. **Environment Isolation**:
   - Client access uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - Never embed or check in `SUPABASE_SERVICE_ROLE_KEY` in frontend source code.
4. **Client Pattern**: Export a singleton Supabase client from `client/src/lib/supabase.js`. Support graceful fallback when environment variables are not yet configured.

---

## 6. Security & Authorization Rules

1. **Database-Authoritative Security**: Client-side role checks (e.g. `user.role === 'Admin'`) are UI conveniences only. Authorization must be strictly enforced via Postgres RLS policies based on `auth.uid()` and an authoritative `public.profiles.role` column.
2. **Profile RLS**:
   - Users can read their own profile and basic public profile info of other campus members.
   - Users can update only their own profile details.
   - Only users with role `'Admin'` can update account statuses (e.g., `'Suspended'`, `'Inactive'`, `'Active'`), approve faculty, or update other users' records.
3. **Storage RLS**:
   - Profile avatar uploads must restrict write/delete permissions to `auth.uid() = (storage.foldername(name))[1]` or equivalent authenticated user folder structure.
4. **No Service-Role Key on Frontend**: Never bundle the service-role key in Vite or expose it via client env vars.

---

## 7. Error Handling & Validation Standards

1. **No Fake Success**: Never show a success toast or confirmation dialog unless the underlying Supabase API call succeeded.
2. **Informative Error Messages**: Display clear, contextual error notices adhering to the UI design (e.g., red badge or red alert box `text-[#ba1a1a] bg-[#fff5f5] border border-[#ba1a1a]/20`).
3. **Password Recovery Truthfulness**: Never claim an email was dispatched if the Supabase Auth API failed or returned an error. Clearly communicate any environment rate limits or unconfigured SMTP limitations.
4. **Input Sanitization**: Trim whitespace from full names, emails, student IDs, and faculty IDs. Enforce minimum password lengths (at least 8 characters) before dispatch.

---

## 8. Verification & Reporting Protocol

After **every implementation prompt**, the assistant MUST provide a structured final report containing:
1. **Markdown and Code Files Created or Updated**: Exact file paths and brief purpose.
2. **Frontend Components Inspected or Modified**: Verified component paths and interface changes.
3. **Current Backend 1 Integration State**: Connection status, mock vs. live state, and auth session wiring.
4. **Unrelated Modules Deliberately Left Untouched**: Confirmation that reports, claims, messaging, and category lists were preserved.
5. **Existing Integration Points Identified**: Any external references or backend bridges.
6. **Validation Commands Executed & Actual Results**: Output of build, lint, and test scripts.
7. **Missing Configuration or Known Blockers**: Missing credentials, rate limits, or pending setup.
8. **Recommended Next Step**: Specific scope and goals for the subsequent prompt.

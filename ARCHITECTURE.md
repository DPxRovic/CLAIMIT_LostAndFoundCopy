# ARCHITECTURE.md — System Architecture & Backend 1 Foundation

## 1. System Overview & Technology Stack

ClaimIt is designed as a modular campus web application. The frontend is a React 19 Single Page Application built on Vite, while the backend for **Backend 1: ROVIC** is backed by **Supabase** (PostgreSQL, Supabase Auth, Row Level Security, and Supabase Storage).

```
┌────────────────────────────────────────────────────────────────────────┐
│                          REACT 19 SPA (Vite)                           │
│                                                                        │
│  ┌───────────────────────┐                 ┌────────────────────────┐  │
│  │   AuthFlow & Login    │                 │  Admin User Management │  │
│  │ (Student/Faculty Reg) │                 │  & Account Modals      │  │
│  └──────────┬────────────┘                 └───────────┬────────────┘  │
│             │                                          │               │
│  ┌──────────▼────────────┐                 ┌───────────▼────────────┐  │
│  │    Profile Settings   │                 │     Admin Dashboard    │  │
│  │    & User Modals      │                 │     Account Metrics    │  │
│  └──────────┬────────────┘                 └───────────┬────────────┘  │
│             │                                          │               │
│             └─────────────────────┬────────────────────┘               │
│                                   │                                    │
│                     ┌─────────────▼─────────────┐                      │
│                     │   Supabase Client / Lib   │                      │
│                     │  (VITE_SUPABASE_ANON_KEY) │                      │
│                     │  client/src/lib/supabase  │                      │
│                     └─────────────┬─────────────┘                      │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │ HTTPS / WSS
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE CLOUD (Free Tier)                      │
│                                                                        │
│  ┌─────────────────────────┐             ┌──────────────────────────┐  │
│  │      Supabase Auth      │             │     Supabase Storage     │  │
│  │  (JWT, Sessions, Users) │             │    ('avatars' bucket)    │  │
│  └──────────┬──────────────┘             └─────────────┬────────────┘  │
│             │ auth.uid()                               │               │
│             ▼                                          │               │
│  ┌─────────────────────────────────────────────────────▼────────────┐  │
│  │                   PostgreSQL Database (RLS)                      │  │
│  │                                                                  │  │
│  │  • public.profiles (Account Details, Roles, Status, Audit Stats) │  │
│  │  • public.account_audit_logs (Admin Actions, Status Transitions) │  │
│  │  • Trigger: on_auth_user_created (Auto-profile provisioning)     │  │
│  │  • Trigger: check_profile_privilege_escalation (Anti-tamper)     │  │
│  │  • Security Definer RPCs (admin_approve_faculty, etc.)           │  │
│  │  • Migration: 20261019000001_create_account_schema.sql           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. PostgreSQL Schema & Data Ownership

Backend 1 owns the identity, profile, and authorization tables in PostgreSQL. All schema definitions are version-controlled in `supabase/migrations/20261019000001_create_account_schema.sql`.

### 2.1 Table: `public.profiles`

```sql
CREATE TYPE public.user_role AS ENUM ('Student', 'Faculty', 'Staff', 'Admin');
CREATE TYPE public.account_status AS ENUM ('Active', 'Pending approval', 'Suspended', 'Inactive', 'Declined');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  role public.user_role NOT NULL DEFAULT 'Student',
  status public.account_status NOT NULL DEFAULT 'Active',
  
  -- Student Specific Details
  school_id TEXT,
  program TEXT,
  year_level TEXT,
  section TEXT,
  
  -- Faculty / Staff Specific Details
  faculty_id TEXT,
  department TEXT,
  position TEXT,
  
  -- General Profile
  campus TEXT DEFAULT 'Main Campus',
  contact_number TEXT,
  avatar_url TEXT,
  
  -- Administrative Review & Lifecycle Metadata
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  declined_at TIMESTAMPTZ,
  declined_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  declined_reason TEXT,
  declined_note TEXT,
  
  suspended_at TIMESTAMPTZ,
  suspended_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  suspend_reason TEXT,
  
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  inactive_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### 2.2 Table: `public.account_audit_logs`
Tracks administrative lifecycle actions (approvals, suspensions, reactivations, deactivations, edits):

```sql
CREATE TABLE public.account_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'approve_faculty', 'decline_faculty', 'suspend_account', 'reactivate_account', 'deactivate_account', 'edit_details'
  reason TEXT,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

## 3. Database Functions, Triggers & Role Protection

### 3.1 Automatic Profile Provisioning (`handle_new_user`)
- Fired `AFTER INSERT ON auth.users`.
- Inspects `raw_user_meta_data` from the Supabase Auth signup payload.
- **Anti-tamper rule**: A public signup request can **NEVER** set `role = 'Admin'` or `role = 'Staff'`. If `'Faculty'` is requested, assigns role `'Faculty'` and initial status `'Pending approval'`. If `'Student'` or any unexpected role is submitted, defaults to role `'Student'` and status `'Active'`.

### 3.2 Privilege Escalation Guard (`protect_profile_privileges`)
- Fired `BEFORE UPDATE ON public.profiles`.
- If the caller is not a confirmed active administrator (`NOT public.is_admin()`):
  - Raises exception on any attempt to alter `NEW.role`.
  - Raises exception on any attempt to alter `NEW.status`.
  - Raises exception on any attempt to tamper with administrative metadata (`approved_*`, `declined_*`, `suspended_*`, `deactivated_*`).

### 3.3 Trusted Administrative RPC Functions
Administrative actions are exposed exclusively through trusted `SECURITY DEFINER` stored procedures that verify `public.is_admin()`:
- `public.admin_approve_faculty(target_user_id UUID)`
- `public.admin_decline_faculty(target_user_id UUID, reason TEXT, note TEXT)`
- `public.admin_suspend_user(target_user_id UUID, reason TEXT)` (prevents self-suspension)
- `public.admin_reactivate_user(target_user_id UUID)`
- `public.admin_deactivate_user(target_user_id UUID, reason TEXT)` (prevents self-deactivation)
- `public.admin_update_user_details(target_user_id UUID, ...)`

---

## 4. Row Level Security (RLS) & Authorization

RLS is enabled on every table. The database authoritatively enforces security boundaries:

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_audit_logs ENABLE ROW LEVEL SECURITY;
```

### 4.1 Profiles Policies
1. **SELECT**:
   - `id = auth.uid()` (own private record).
   - `public.is_admin()` (active admins view all).
   - `status = 'Active'` (authenticated campus members view active directory profiles).
   - Anonymous visitors are denied (0 rows).
2. **UPDATE**:
   - `id = auth.uid() OR public.is_admin()`, strictly guarded by `protect_profile_privileges()` trigger.
3. **INSERT**:
   - `id = auth.uid() OR public.is_admin()`, backed by trigger on auth.users.
4. **DELETE**:
   - `public.is_admin()` (Admins only).

### 4.2 Audit Logs Policies
1. **SELECT**: `public.is_admin()` only.
2. **INSERT**: `public.is_admin()` and trusted RPC functions.
3. **UPDATE / DELETE**: **DENIED** for all callers (append-only ledger).

---

## 5. Storage Architecture (Profile Avatars)

- **Bucket**: `avatars` (Public read, authenticated user write, 2MB file limit).
- **Storage Path Pattern**: `${auth.uid()}/${filename}`
- **Storage RLS Policies**:
  - `SELECT`: Allowed for public.
  - `INSERT`: Allowed only when `(storage.foldername(name))[1] = auth.uid()::text`.
  - `UPDATE` / `DELETE`: Allowed only for the profile photo owner or an Administrator.

---

## 6. Integration Boundaries & Untouched Modules

To safeguard existing features, Backend 1 enforces strict integration firewalls:

| Module | Files | Status / Backend Used | Action Taken by Backend 1 |
| :--- | :--- | :--- | :--- |
| **Authentication & Accounts** | `AuthFlow.jsx`, `Login.jsx`, `RegForm*.jsx`, `Password*.jsx`, `ProfileSettings.jsx`, `UserManagement.jsx`, `Dashboard.jsx` (accounts table) | Migrating to **Supabase** | Implement Supabase Auth, profiles query, RLS, RPC wrappers |
| **Lost & Found Reports** | `MyReports.jsx`, `AddReportItem.jsx`, `ReportDetailsModal.jsx`, `ReportsAdmin.jsx` | Local state / Independent | **Untouched**. Reads mock or existing state; no schema changes. |
| **Browse Items** | `BrowseItems.jsx`, `BrowseItemDetailsModal.jsx`, `ItemCard.jsx` | Local state / Independent | **Untouched**. Reads mock or existing state. |
| **Claims & Matches** | `ClaimsAndMatches.jsx`, `ClaimMatchDetailsModal.jsx`, `WithdrawClaimMatchModal.jsx` | Local state / Independent | **Untouched**. |
| **Messaging** | `ConversationMessage.jsx`, `ClaimMatchMessageModal.jsx` | Local state / Independent | **Untouched**. |
| **Categories & Lists** | `ManageLists.jsx`, `AddModalManageLists.jsx`, etc. | Local state / Independent | **Untouched**. |
| **Notifications** | `Notifications.jsx` | Local state / Independent | **Untouched**. |
| **System Activity Logs** | `ActivityLogs.jsx` | Local state / Independent | **Untouched**. |

---

## 7. Implementation Inventory

| Component Path | Responsibility | Current Data Source | Service Used | Target Supabase Integration | UI Preserved? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `client/src/lib/supabase.js` | Supabase singleton client & admin RPC wrappers | Environment variables | Supabase Client SDK | Configured and exported | Yes |
| `client/src/components/auth/Login.jsx` | Sign in view, password toggle, view routing | React local state (`useState`) | None (Mock) | `supabase.auth.signInWithPassword` + profile lookup | Yes, 100% |
| `client/src/components/auth/RegFormStudent.jsx` | Student registration form & validation | React local state (`useState`) | None (Mock) | `supabase.auth.signUp` + trigger on `auth.users` | Yes, 100% |
| `client/src/components/auth/RegFormFaculty.jsx` | Faculty registration form & validation | React local state (`useState`) | None (Mock) | `supabase.auth.signUp` + trigger (status: Pending approval) | Yes, 100% |
| `client/src/components/auth/AuthFlow.jsx` | Step coordinator for password reset flow | React local state (`useState`) | None (Mock) | Coordinates Supabase OTP / password reset | Yes, 100% |
| `client/src/components/auth/ForgotPassword.jsx` | Email submission for password reset | React local state (`useState`) | None (Mock) | `supabase.auth.resetPasswordForEmail` | Yes, 100% |
| `client/src/components/auth/VerifyCode.jsx` | 6-digit OTP verification & resend | React local state (`useState`) | None (Mock) | `supabase.auth.verifyOtp` (token verification) | Yes, 100% |
| `client/src/components/auth/ResetPassword.jsx` | Set new password after OTP verification | React local state (`useState`) | None (Mock) | `supabase.auth.updateUser({ password })` | Yes, 100% |
| `client/src/components/auth/PasswordResetSuccess.jsx` | Success confirmation screen | Static view with callback | None (Mock) | Returns user to login with success alert | Yes, 100% |
| `client/src/components/user/ProfileSettings.jsx` | Student profile edits, avatar upload, password changes | Component prop `initialUser` + local state | None (Mock) | Query/mutate `profiles` + Supabase Storage `avatars` bucket | Yes, 100% |
| `client/src/components/admin/pages/AdminProfileSettings.jsx` | Admin profile edits, avatar, contact, password | Component prop `initialUser` + local state | None (Mock) | Query/mutate `profiles` + `supabase.auth.updateUser` | Yes, 100% |
| `client/src/components/admin/pages/UserManagement.jsx` | User management directory, subtabs, filter, search, CSV | In-memory `INITIAL_ALL_USERS`, `INITIAL_PENDING_USERS` | None (Mock) | Query `profiles` table with filter/search, mutate statuses | Yes, 100% |
| `client/src/components/admin/pages/Dashboard.jsx` | Admin dashboard overview metrics and recent accounts table | In-memory `INITIAL_ACCOUNTS` | None (Mock) | Query aggregate counts + latest 10 rows from `profiles` | Yes, 100% |
| `client/src/components/admin/modals/AddAccountModal.jsx` | Administrative direct account creation | React local state (`useState`) | None (Mock) | `supabase.auth.signUp` or admin insert into `profiles` | Yes, 100% |
| `client/src/components/admin/modals/AdminAccountModals.jsx` | Faculty review, approval, decline modal flow | In-memory callbacks (`onApprove`, `onConfirmDecline`) | None (Mock) | RPCs `admin_approve_faculty`, `admin_decline_faculty` | Yes, 100% |
| `client/src/components/admin/modals/UserAccountModals.jsx` | User details, edit, reset pw, suspend, deactivate | In-memory state and callback triggers | None (Mock) | RPCs `admin_suspend_user`, `admin_reactivate_user`, etc. | Yes, 100% |
| `client/src/components/shared/UserProfileModal.jsx` | Popover user identity card in top navigation | Component prop `user` | None (Mock) | Connected to global user session context | Yes, 100% |
| `client/src/components/shared/LogoutConfirmation.jsx` | Logout confirmation modal | Component props `isOpen`, `user` | None (Mock) | Calls `supabase.auth.signOut()` on confirm | Yes, 100% |

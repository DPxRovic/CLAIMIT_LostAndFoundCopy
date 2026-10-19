# PRODUCT.md — Functional Specifications for Backend 1 (ROVIC)

## 1. Product Overview

**ClaimIt** is a digital lost-and-found management ecosystem tailored for university campuses (specifically modelled after UCC - University of Caloocan City). The platform centralizes reported missing and found items, streamlines claim disputes, facilitates peer communication, and maintains an accountable campus identity directory.

**Backend 1 (ROVIC)** governs user authentication, identity records, role-based authorization, self-service settings, and administrator account oversight.

---

## 2. User Roles & Permissions

| Role | Target Users | Onboarding Requirement | Core Privileges |
| :--- | :--- | :--- | :--- |
| **Student** | Undergraduate campus students | Direct registration with campus email (`@ucc.edu.ph` / campus domain) and valid Student ID | • Report lost/found items<br>• Submit item claims and matches<br>• Chat with posters/claimants<br>• Update self profile & password |
| **Faculty** | Academic professors, instructors, department personnel | Registration with Faculty/Employee ID & department; **requires Admin Approval** before active login | • Full student privileges<br>• Priority badge on campus notices<br>• Departmental lost item management |
| **Admin** | Campus security officers, student affairs staff, system administrators | Direct administrator provisioning or database role elevation | • Full access to Admin Portal<br>• Approve or decline faculty registrations<br>• Create, edit, suspend, deactivate user accounts<br>• Generate temporary passwords<br>• View account dashboard analytics |

---

## 3. Account Statuses & Lifecycle

Every account record in ClaimIt transitions through well-defined lifecycle states:

```
[Student Registration] ──────────────────────────> ACTIVE ───┬───> SUSPENDED ───> ACTIVE (Reactivated)
                                                              │
[Faculty Registration] ───> PENDING APPROVAL ──┬──> ACTIVE ──┼───> INACTIVE (Deactivated / Soft Delete)
                                               │              │
                                               └──> DECLINED  └───> DELETED (Hard delete - Admin only)
```

1. **`Active`**: Account in good standing. Can log in, file reports, claim items, message other users, and edit profile.
2. **`Pending approval`**: Applied faculty registrations. Cannot access authenticated user features until reviewed by an administrator.
3. **`Suspended`**: Account temporarily blocked by an admin (e.g. for abusive behavior or false claims). Log-in is prevented; existing active reports are hidden from public browsing; records and claim history are preserved.
4. **`Inactive`**: Account deactivated (soft deletion) when a student graduates or faculty departs. Login is revoked; historical reports, claims, and audit entries remain linked for archival integrity.
5. **`Declined`**: Applied faculty registration rejected by an admin with a documented reason. Login is prohibited.

---

## 4. Feature Workflows & Requirements

### 4.1 Student Registration
- **Existing UI State**: Implemented in `client/src/components/auth/RegFormStudent.jsx`.
- **Form Fields**: Full Name, UCC Email, Role Switcher (Student active), School ID Number, Program (dropdown: BSCS, BSIT, BSBA, BSED, BSCrim), Year Level (1st–4th Year), Section, Password, Confirm Password.
- **Validation Rules**:
  - Full Name required (non-empty trimmed string).
  - Valid campus email format containing `@`.
  - Password minimum length: 8 characters.
  - Password and Confirm Password must match.
  - School ID Number required.
- **Backend Requirement**: Create Supabase Auth user, record custom metadata, and insert row into `public.profiles` with status `'Active'` and role `'Student'`.

### 4.2 Faculty Registration & Approval Workflow
- **Existing UI State**: Implemented in `client/src/components/auth/RegFormFaculty.jsx`.
- **Form Fields**: Full Name, UCC Email, Role Switcher (Faculty active), Faculty/Employee ID Number, Department (dropdown: CCS, CBA, COED, CAS/CLAS, ENG, ADMIN), Password, Confirm Password.
- **Validation Rules**:
  - Minimum 8-character password with matching confirmation.
  - Valid email and faculty ID number.
  - Department selection required.
- **Backend Requirement**:
  - Insert user record with status `'Pending approval'` and role `'Faculty'`.
  - Account cannot authenticate into the main dashboard until an administrator approves the record.
  - Admin approval updates status to `'Active'` and notifies the applicant.
  - Admin rejection updates status to `'Declined'` with a specified rejection reason.

### 4.3 Authentication & Session Persistence
- **Existing UI State**: Implemented in `client/src/components/auth/Login.jsx`.
- **Form Fields**: Username or Email, Password (with toggle show/hide), "Forgot Password" link, "Register" link.
- **Backend Requirement**:
  - Authenticate against Supabase Auth (`supabase.auth.signInWithPassword`).
  - Retrieve associated profile from `public.profiles`.
  - Enforce status gates: block login if status is `'Pending approval'`, `'Suspended'`, or `'Inactive'`.
  - Persist session in browser local storage; restore session on page reload without visual flicker.

### 4.4 Password Recovery & Reset
- **Existing UI State**: Implemented in `AuthFlow.jsx` via `ForgotPassword.jsx`, `VerifyCode.jsx`, `ResetPassword.jsx`, and `PasswordResetSuccess.jsx`.
- **Current Flow**:
  1. `ForgotPassword`: Collects user email address.
  2. `VerifyCode`: Collects 6-digit verification code with resend countdown timer (30s).
  3. `ResetPassword`: Collects new password and confirmation (minimum 8 characters).
  4. `PasswordResetSuccess`: Confirms update and routes user back to login.
- **Backend Requirement**:
  - Connect to Supabase Auth password reset flow (`supabase.auth.resetPasswordForEmail` / OTP verification `verifyOtp`).
  - Truthful feedback: do not claim codes are sent if email delivery fails. Document Free-plan email constraints (Supabase default rate limit: 3-4 emails/hour without custom SMTP).

### 4.5 User Profile & Settings
- **Existing UI State**: Implemented in `client/src/components/user/ProfileSettings.jsx`.
- **Two Tabs**:
  1. **Profile**:
     - Avatar image upload (preview & upload).
     - Full Name, School ID Number, Program dropdown, School Year, Section.
  2. **Account Settings**:
     - Email (display & update).
     - Change Password: Current Password, New Password, Confirm Password.
- **Backend Requirement**:
  - Update `public.profiles` for profile attributes.
  - Upload avatar to Supabase Storage bucket `avatars`.
  - Call `supabase.auth.updateUser` for email and password adjustments.

### 4.6 Admin Profile & Settings
- **Existing UI State**: Implemented in `client/src/components/admin/pages/AdminProfileSettings.jsx`.
- **Tabs**:
  1. **Profile**: Avatar photo upload, Full Name, Contact Number.
  2. **Account Settings**: Email, Current Password, New Password, Confirm Password.
- **Backend Requirement**: Update admin profile record and auth credentials.

### 4.7 Admin User Management & Modal System
- **Existing UI State**: Implemented in `client/src/components/admin/pages/UserManagement.jsx` with modals in `AddAccountModal.jsx`, `UserAccountModals.jsx`, and `AdminAccountModals.jsx`.
- **Features**:
  - Subtabs: **All Users** vs. **Pending Approvals** with dynamic count badges.
  - Search by name, email, or username.
  - Filter by Role (`All Roles`, `Student`, `Faculty`, `Staff`) and Status (`All Statuses`, `Active`, `Suspended`, `Inactive`, `Pending approval`).
  - Export filtered dataset to CSV.
  - Pagination (8 items per page).
  - Modal operations:
    - Review & Approve Faculty (`ManageAccountModal`).
    - Decline Faculty with structured reason selection and optional note (`DeclineAccountModal`).
    - View Full User Details & Activity counts (`UserDetailsModal`).
    - Edit User Details (`EditDetailsModal`).
    - Administrative Password Reset with temporary password generation (`ResetPasswordModal` + `TempPasswordModal`).
    - Suspend Account with optional logged reason (`SuspendAccountModal`).
    - Deactivate Account with exit reason selection (`DeactivateAccountModal`).
    - Direct Account Creation (`AddAccountModal`).
- **Backend Requirement**:
  - Query `public.profiles` with search, filter, and pagination support.
  - Execute status mutations and audit logging.

### 4.8 Admin Dashboard Account Metrics
- **Existing UI State**: Implemented in `client/src/components/admin/pages/Dashboard.jsx`.
- **Features**:
  - Snapshot count cards: Total Accounts, Students, Faculty, Suspended.
  - Recent accounts table with pagination, search, filter, and CSV export.
  - Action trigger to approve/decline pending requests.
- **Backend Requirement**: Real-time or query-based account counts and recent accounts list.

---

## 5. Explicit Non-Goals for Backend 1

The following functions are strictly OUT OF SCOPE for Backend 1 and must NOT be altered or migrated in this milestone:
1. **Report Pipeline**: Creation, deletion, categorization, or location tagging of Lost & Found items.
2. **Claims Engine**: Submitting claims, match score calculations, or proof-of-ownership verification.
3. **Real-time Chat**: Direct messaging between claim submitters and item finders.
4. **Item Category Management**: Editing campus categories and item taxonomy in `ManageLists.jsx`.
5. **System Activity Logs**: Activity logging for item reports and claims in `ActivityLogs.jsx`.

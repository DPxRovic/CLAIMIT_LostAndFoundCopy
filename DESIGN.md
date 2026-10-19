# DESIGN.md — Visual Architecture & UI Preservation Guide

## 1. Visual Identity & Design System

The ClaimIt interface is engineered with a clean, high-contrast, academic campus aesthetic characterized by soft background tints, crisp ivory/warm-gray borders, vibrant cobalt accents, and legible typography.

### 1.1 Color Palette & Token Hierarchy

| Token Name | Hex Code / Tailwind Token | Usage in Codebase |
| :--- | :--- | :--- |
| **Canvas Background** | `#f8f9ff` | Root layout background, full-page views, body background |
| **Surface (Card)** | `#ffffff` / `bg-white` | Content containers, modal dialogs, input backgrounds, table panels |
| **Surface Subdued** | `#F9FAFB` / `#F8F9FA` | Table header rows, preview strips, disabled containers |
| **Primary Brand** | `#5170ff` | Primary action buttons, active navigation indicators, primary links, focus rings |
| **Primary Hover** | `#4767f6` / `#3d5cf5` | Hover state for primary buttons and interactive elements |
| **Primary Active** | `#2b47dc` | Active/pressed state for primary buttons |
| **Primary Tint** | `#EFF4FF` / `#eff4ff` | Active subtab backgrounds, badge backgrounds, input focus ring tints (`ring-[#5170ff]/20`) |
| **Border Neutral** | `#E8E4D8` | Standard card borders, table dividers, input borders, separator lines |
| **Text Primary** | `#23261F` | Form labels, titles, table cell primary values, card headings |
| **Text Secondary** | `#6E6858` | Subtitles, field descriptions, metadata timestamps, table secondary labels |
| **Text Subdued** | `#444655` / `#64748b` | Minor caption text, icon inactive states, table column header titles |
| **Success Emerald** | `#047857` (text), `#10B981` (dot), `#ECFDF5` (bg) | Active status badge, verification confirmations, toast feedback |
| **Danger Red** | `#B91C1C` / `#ba1a1a` / `#DC2626` (text), `#FEF2F2` (bg), `#FECACA` (border) | Suspended status badge, account deactivation, logout triggers, error messages |
| **Warning Amber** | `#92400E` (text), `#D97706` (dot), `#FEF3C7` (bg) | Pending approval status badge, warning callouts |
| **Inactive Gray** | `#4B5563` (text), `#6B7280` (dot), `#F3F4F6` (bg) | Inactive status badge, disabled controls |

### 1.2 Typography System

- **Primary Body Font**: `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Headings & Brand Title**: `'Plus Jakarta Sans', 'Inter', system-ui, sans-serif`
- **Iconography**:
  - Google Fonts **Material Symbols Outlined**: `<span className="material-symbols-outlined text-[20px]">icon_name</span>`
  - Feather/Lucide Icons (`lucide-react`): `<User className="w-4 h-4" />`, `<Lock />`, `<LogOut />`, etc.

### 1.3 Border Radii & Geometry
- **Outer Modals & Cards**: `rounded-2xl` (for auth cards) or `rounded-xl` (for admin cards and dialogs)
- **Buttons & Form Inputs**: `rounded-lg` (`h-11` or `h-12` in auth forms, `px-3.5 py-2` in tables)
- **Status Badges & Avatar Containers**: `rounded-full`
- **Shadows**:
  - Floating cards: `shadow-[0_4px_24px_rgba(81,112,255,0.06)]`
  - Modals: `shadow-xl` or `shadow-2xl`
  - Buttons: `shadow-sm hover:shadow`

---

## 2. Component Structures & Existing Patterns

### 2.1 Authentication Cards (`Login`, `RegFormStudent`, `RegFormFaculty`, `ForgotPassword`, etc.)
- **Container Structure**: Centered on page with `min-h-screen bg-[#f8f9ff] flex items-center justify-center p-4 sm:p-6`.
- **Card**: `w-full max-w-[480px]` (login/forgot password) or `max-w-[570px]` (registration) with `bg-white rounded-2xl border border-[#E8E4D8]`.
- **Header**: Official ClaimIt logo image with SVG magnifying glass fallback, centered 24–30px heading, subtitle in `#6E6858`.
- **Role Switcher**: Segmented toggle pills inside `bg-[#eff4ff] rounded-lg border border-[#E8E4D8]` with active white pill elevated by `shadow-xs`.
- **Field Layout**:
  - Two-column grid (`grid grid-cols-1 sm:grid-cols-2 gap-3`) for compact registration forms.
  - Form labels: `text-xs sm:text-[15px] font-semibold text-[#23261F] mb-1 sm:mb-2`.
  - Input styling: `border border-[#E8E4D8] rounded-lg focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20 outline-none`.
  - Password visibility toggle: Absolute-positioned eye icon button on the right inside the input wrapper.
- **Action Buttons**: Full-width `bg-[#5170ff] hover:bg-[#4767f6] text-white font-medium rounded-lg h-12` with active scale transition `active:scale-[0.99]`.

### 2.2 Profile Settings (`ProfileSettings.jsx` & `AdminProfileSettings.jsx`)
- **Layout**: Two-column layout with fixed sidebar card (`w-full md:w-64 lg:w-72 p-4`) and expansive content card (`flex-1 p-6 sm:p-8`).
- **Sidebar**:
  - Top avatar thumbnail (`w-11 h-11 rounded-full border border-[#E8E4D8]`), user name and email.
  - Tab navigation buttons with icon on left (`Profile`, `Account Settings`).
  - Red-accented Log Out trigger at sidebar base.
- **Settings Row Pattern**: Two-column responsive row with title/description on left (`md:grid-cols-[180px_minmax(0,1fr)]`) and fields on right.
- **Save Trigger**: Right-aligned `Apply` button (`btnPrimary`).
- **Toast Feedback**: Floating toast bottom-right (`fixed bottom-6 right-6 z-50 bg-[#23261F] text-white px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-2`).

### 2.3 User Management (`UserManagement.jsx`) & Admin Dashboard (`Dashboard.jsx`)
- **Header**: Title (`text-2xl font-bold text-[#23261F]`), subtitle, and top-right `Add Account` action button.
- **Metric Cards (Dashboard)**: 4-card grid with category icon, uppercase 11px label, and large bold count.
- **Subtabs (User Management)**: Underlined tabs (`All Users`, `Pending Approvals`) with numeric count badges (`bg-[#5170ff] text-white` when active).
- **Control Bar**:
  - Search input with leading search icon and trailing clear button `✕`.
  - Native custom dropdowns (`FilterSelect`) for Role and Status.
  - Section count indicator with right-aligned `Export CSV` link.
- **Data Table**:
  - Header: `#F8F9FA` background with 11px uppercase tracking-wider text.
  - Avatar Column: Circle avatar with initials or colored background + full name and email stack.
  - Role Column: Pill badge in `#EFF4FF` with `#5170ff` text.
  - Status Column: Pill badge with color-coded dot and background.
  - Action Column: Right-aligned outline `Manage` button (`px-3.5 py-1.5 rounded-lg border border-[#E8E4D8] text-xs font-medium text-[#23261F]`).
- **Pagination**: Bottom border strip with showing range (`Showing 1–8 of 10 accounts`), numbered buttons, and previous/next buttons.

### 2.4 Modal Dialogs
- **Backdrop**: `fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs`.
- **Card**: `relative w-full max-h-[calc(100vh-1.5rem)] overflow-y-auto bg-white rounded-xl shadow-xl border border-[#E8E4D8] p-5`.
- **Close Button**: Top right `w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:bg-[#e5eeff]`.
- **Escape Key & Outside Click**: Handled via `window.addEventListener('keydown')` and ref checks.
- **Variant Types**:
  1. `ManageAccountModal`: Header badges, profile summary, DL grid of details, 3 counter tiles, action footer (Decline vs. Approve).
  2. `DeclineAccountModal`: Warning circle icon, radio list of 4 decline reasons, custom note textarea, send email checkbox, Cancel vs. Decline Account buttons.
  3. `ApprovedAccountModal` / `DeclinedAccountModal`: Centered status icon (emerald checkmark or red prohibition), summary card, View Activity Log link, Done button.
  4. `UserDetailsModal`: Comprehensive profile, details grid, report/claim counters, action row (`Edit details`, `Reset password`, `Deactivate`), status toggle (`Suspend account` / `Reactivate account`).
  5. `SuspendAccountModal` / `DeactivateAccountModal`: Destructive modal with reason selection or input and confirmation buttons.
  6. `ResetPasswordModal` & `TempPasswordModal`: Danger warning + dashed card revealing temporary password with one-click copy button.
  7. `UserProfileModal`: Compact dropdown popover from the top navigation avatar (`max-w-[288px]`).
  8. `LogoutConfirmation`: Centered dialog with red logout badge, account identity strip, and Cancel vs. Log Out buttons.

---

## 3. UI Preservation Constraints

1. **Strictly Retain Class Names and Inline Tokens**: All Tailwind utility classes in `UserManagement.jsx`, `Dashboard.jsx`, `AuthFlow.jsx`, `Login.jsx`, `ProfileSettings.jsx`, and associated modals must be preserved without replacement.
2. **Preserve Form Labels & Placeholders**: Labels such as `"School ID Number"`, `"Faculty/Employee ID"`, `"UCC Email"`, `"e.g. 2022-01452-MN-0"` provide institutional context and must not be altered.
3. **No Foreign Component Libraries**: Do not replace custom modals or tables with Bootstrap, Material-UI, or Ant Design components.

# ClaimIt — Campus Lost and Found

A modern digital lost-and-found management system designed for university campuses (University of Caloocan City / UCC). ClaimIt empowers students, faculty, and administrative staff to report lost or found items, browse catalogued belongings, verify claims and item matches, and manage campus identity profiles.

---

## 1. System Requirements & Runtime

- **Node.js**: v20.x or v22.x (LTS recommended)
- **npm**: v10.x or later
- **Package Architecture**: npm Workspaces monorepo (`client/` for the Vite + React SPA)

---

## 2. Installation & Quick Start

### 2.1 Clone and Install Dependencies
```bash
# Clone the repository
git clone https://github.com/DPxRovic/CLAIMIT_LostAndFoundCopy.git
cd CLAIMIT_LostAndFoundCopy

# Install workspace dependencies
npm install
```

### 2.2 Configure Environment Variables
Copy `.env.example` into a local `.env` file inside the `client/` directory (or workspace root):

```bash
cp .env.example client/.env
```

Set your Supabase credentials:
```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

> **IMPORTANT**: Never commit `.env` or `SUPABASE_SERVICE_ROLE_KEY` to Git. The frontend only requires the public anonymous key (`VITE_SUPABASE_ANON_KEY`).

### 2.3 Run the Development Server
```bash
# Starts the Vite development server on port 3000 (host: 0.0.0.0)
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server on port 3000 |
| `npm run build` | Compiles the production build into `client/dist/` |
| `npm run lint` | Runs the Oxlint static analyzer across the codebase |
| `node test-master-audit-suite.js` | Runs the Master God Prompt 8 complete verification & journey audit suite |
| `node test-admin-account-management.js` | Runs Prompt 6 admin management and status enforcement tests |
| `node test-profile-settings.js` | Runs Prompt 5 profile settings, anti-tamper, and storage isolation tests |
| `node test-dashboard-and-faculty-workflow.js` | Runs Prompt 7 dashboard metrics and faculty workflow tests |

---

## 4. Supabase Setup & Migrations (Backend 1: ROVIC)

### 4.1 Required Environment Variables
The application requires the following environment variables (set in `.env` or deployment runtime):
```ini
VITE_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-ANON-PUBLIC-KEY]
```
> **SECURITY DIRECTIVE**: Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code, environment files, or client builds. All operations use the public anonymous key with PostgreSQL Row Level Security (RLS) and Security Definer RPC functions.

### 4.2 Database Migrations (Apply in Order)
Version-controlled migrations are stored under `supabase/migrations/`:
1. `supabase/migrations/20261019000001_create_account_schema.sql` — Schema definition for `profiles`, `account_audit_logs`, trigger provisioning, and initial RPCs.
2. `supabase/migrations/20261019000002_add_username_lookup.sql` — Secure username-to-email lookup RPC (`lookup_email_by_username`).
3. `supabase/migrations/20261020000001_profile_storage_security.sql` — Avatar storage folder isolation (`${auth.uid()}/*`) and RLS policies.
4. `supabase/migrations/20261020000002_admin_management_and_status_enforcement.sql` — Authoritative admin actions (`admin_suspend_user`, `admin_reactivate_user`, `admin_deactivate_user`, `admin_reset_user_password`).
5. `supabase/migrations/20261021000001_dashboard_stats_and_faculty_workflow.sql` — Authoritative dashboard stats RPC (`admin_get_dashboard_stats`) and concurrency-safe approval/decline state machines.

To apply migrations to your Supabase project:

**Option A — Supabase Web Dashboard (Recommended & Instant)**:
1. Open the [Supabase Dashboard](https://supabase.com/dashboard) and navigate to the **SQL Editor**.
2. Click **New Query**.
3. Copy and execute each migration file in chronological order.
4. Verify that tables, triggers, and functions appear in the schema cache.

**Option B — Supabase CLI**:
```bash
npx supabase db push --db-url "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

### 4.3 Supabase Auth Configuration
1. In the Supabase Dashboard, navigate to **Authentication > Providers > Email**.
2. Enable the **Email** provider.
3. Configure sign-up confirmations:
   - For rapid local development, toggle **Confirm email** off, or configure SMTP for university email delivery.
4. Set the site redirect URL to `http://localhost:3000`.

### 4.4 Supabase Storage (Profile Avatars)
1. Navigate to **Storage** in the Supabase Dashboard.
2. Create a new bucket named `avatars`.
3. Set the bucket to **Public** read access.
4. Apply the Storage RLS policies provided in `ARCHITECTURE.md` to restrict file uploads to the authenticated user's folder (`${userId}/*`).

---

## 5. Free-Plan Constraints & Safe Development Practices

ClaimIt's Backend 1 is intentionally structured to operate fully within Supabase's Free Tier:
- **Email Delivery Rate Limits**: Default Supabase mail services have a limit of 3–4 emails per hour. For production campus-wide deployment, connect a custom SMTP provider (e.g. university mail relay or SendGrid).
- **Storage Limits**: Avatar uploads should be limited to 2MB per image to preserve the 1GB free storage tier.
- **Database Sleep**: Supabase free projects pause after 7 days of inactivity. Ensure regular database pings or restore via the dashboard if paused.
- **Truthful Error Handling**: The frontend does not pretend emails were sent or passwords reset unless the Supabase API confirms success.

---

## 6. Architecture & Integration Boundaries

- **Backend 1 Ownership (ROVIC)**:
  - Student & Faculty Registration
  - Faculty Approval Workflow
  - Authentication, Sessions, and Logout
  - Password Reset via OTP / Email
  - Profiles & Profile Avatars
  - Admin User Management & Dashboard Account Metrics
- **Untouched Modules**:
  - Lost & Found item reports (`MyReports.jsx`, `AddReportItem.jsx`, `ReportDetailsModal.jsx`)
  - Item catalog and browsing (`BrowseItems.jsx`)
  - Claims, item matching, and proof verification (`ClaimsAndMatches.jsx`)
  - Direct peer-to-peer messaging (`ConversationMessage.jsx`)
  - Taxonomy and category management (`ManageLists.jsx`)

For deep architectural and design specifications, refer to `ARCHITECTURE.md`, `DESIGN.md`, and `PRODUCT.md`.

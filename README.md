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

---

## 4. Supabase Setup (Backend 1: ROVIC)

### 4.1 Create a Free Supabase Project
1. Log in to [Supabase](https://supabase.com).
2. Click **New Project** (select your preferred region).
3. Retrieve your **Project URL** and **anon public API Key** under **Project Settings > API**.

### 4.2 Database Migrations
Version-controlled migrations are stored under `supabase/migrations/`:
- `supabase/migrations/20261019000001_create_account_schema.sql`

To apply the migration to your Supabase project:

**Option A — Supabase Web Dashboard (Recommended & Instant)**:
1. Open the [Supabase Dashboard](https://supabase.com/dashboard) and navigate to the **SQL Editor**.
2. Click **New Query**.
3. Copy the entire contents of `supabase/migrations/20261019000001_create_account_schema.sql` and paste it into the editor.
4. Click **Run** to execute the migration.

**Option B — Supabase CLI**:
```bash
# Push migration using your database connection string
npx supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-DB-HOST]:5432/postgres"

# Or link and push if you have your project ref and personal access token:
npx supabase link --project-ref [YOUR-PROJECT-REF]
npx supabase db push
```

The migration provisions:
- `public.profiles`: Stores student and faculty information, approval statuses, and role assignments.
- `public.account_audit_logs`: Records administrative decisions (faculty approvals, declines, suspensions).
- PostgreSQL triggers (`handle_new_user`, `protect_profile_privileges`) ensuring zero client-side privilege escalation.
- Administrative RPC functions (`admin_approve_faculty`, `admin_decline_faculty`, `admin_suspend_user`, `admin_reactivate_user`, `admin_deactivate_user`, `admin_update_user_details`).
- Row Level Security (RLS) policies enforcing database-authoritative authorization.
- `avatars` Supabase Storage bucket with public read and authenticated owner write access.

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

-- =============================================================================
-- Migration: 20261019000001_create_account_schema.sql
-- Description: Core account schema, roles, statuses, RLS policies, audit logging,
--              and administrative security functions for Backend 1 (ROVIC).
-- =============================================================================

-- 1. ENUMS FOR ROLES AND ACCOUNT STATUSES
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('Student', 'Faculty', 'Staff', 'Admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM (
    'Active',
    'Pending approval',
    'Suspended',
    'Inactive',
    'Declined'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. HELPER FUNCTIONS: TIMESTAMP MANAGEMENT
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CORE TABLE: public.profiles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  role public.user_role NOT NULL DEFAULT 'Student',
  status public.account_status NOT NULL DEFAULT 'Active',
  
  -- Student Specific Fields
  school_id TEXT,
  program TEXT,
  year_level TEXT,
  section TEXT,
  
  -- Faculty / Staff Specific Fields
  faculty_id TEXT,
  department TEXT,
  position TEXT,
  
  -- Campus & Contact Details
  campus TEXT DEFAULT 'Main Campus',
  contact_number TEXT,
  avatar_url TEXT,
  
  -- Faculty Approval Metadata
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  declined_at TIMESTAMPTZ,
  declined_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  declined_reason TEXT,
  declined_note TEXT,
  
  -- Suspension Metadata
  suspended_at TIMESTAMPTZ,
  suspended_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  suspend_reason TEXT,
  
  -- Deactivation (Soft Delete) Metadata
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  inactive_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger to keep updated_at in sync
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. INDEXES ON public.profiles
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_faculty_id ON public.profiles(faculty_id);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- 5. AUDIT LOGGING: public.account_audit_logs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.account_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  reason TEXT,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.account_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.account_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.account_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.account_audit_logs(created_at DESC);

-- 6. SECURITY HELPER: Check if caller is active Administrator
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'Admin'
      AND status = 'Active'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 7. SIGN-UP TRIGGER: Automatic Profile Provisioning
-- -----------------------------------------------------------------------------
-- Automatically inserts a corresponding row in public.profiles when an identity
-- signs up via Supabase Auth. Prevents self-promotion to 'Admin'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role public.user_role;
  v_status public.account_status;
  v_full_name TEXT;
  v_username TEXT;
  v_school_id TEXT;
  v_program TEXT;
  v_year_level TEXT;
  v_section TEXT;
  v_faculty_id TEXT;
  v_department TEXT;
  v_meta JSONB;
BEGIN
  v_meta := NEW.raw_user_meta_data;
  
  -- Determine Full Name
  v_full_name := COALESCE(
    v_meta->>'fullName',
    v_meta->>'full_name',
    v_meta->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Determine Username
  v_username := COALESCE(
    v_meta->>'username',
    split_part(NEW.email, '@', 1)
  );

  -- Enforce Role and Status Integrity:
  -- Public signup can NEVER assign 'Admin' or 'Staff'.
  IF lower(COALESCE(v_meta->>'role', '')) = 'faculty' THEN
    v_role := 'Faculty';
    v_status := 'Pending approval'; -- Faculty requires administrative review
    v_faculty_id := v_meta->>'facultyId';
    v_department := v_meta->>'department';
  ELSE
    v_role := 'Student';
    v_status := 'Active'; -- Student accounts activate directly
    v_school_id := v_meta->>'studentId';
    v_program := v_meta->>'program';
    v_year_level := v_meta->>'yearLevel';
    v_section := v_meta->>'section';
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    role,
    status,
    school_id,
    program,
    year_level,
    section,
    faculty_id,
    department,
    avatar_url
  ) VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_username,
    v_role,
    v_status,
    v_school_id,
    v_program,
    v_year_level,
    v_section,
    v_faculty_id,
    v_department,
    v_meta->>'avatarUrl'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. PRIVILEGE ESCALATION PROTECTION TRIGGER
-- -----------------------------------------------------------------------------
-- Ensures normal users cannot escalate their role, alter their approval status,
-- or modify administrative review/audit columns.
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS TRIGGER AS $$
BEGIN
  -- Service role / postgres trigger bypass (e.g. auth hooks or admin RPCs with security definer)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Allow if caller is confirmed active Administrator
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Disallow ordinary users from modifying role or status
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Unauthorized: Users cannot modify their role assignment';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Unauthorized: Users cannot modify their account status';
  END IF;

  -- Disallow modifying administrative audit fields
  IF (NEW.approved_at IS DISTINCT FROM OLD.approved_at) OR
     (NEW.approved_by IS DISTINCT FROM OLD.approved_by) OR
     (NEW.declined_at IS DISTINCT FROM OLD.declined_at) OR
     (NEW.declined_by IS DISTINCT FROM OLD.declined_by) OR
     (NEW.declined_reason IS DISTINCT FROM OLD.declined_reason) OR
     (NEW.suspended_at IS DISTINCT FROM OLD.suspended_at) OR
     (NEW.suspended_by IS DISTINCT FROM OLD.suspended_by) OR
     (NEW.suspend_reason IS DISTINCT FROM OLD.suspend_reason) OR
     (NEW.deactivated_at IS DISTINCT FROM OLD.deactivated_at) OR
     (NEW.deactivated_by IS DISTINCT FROM OLD.deactivated_by) OR
     (NEW.inactive_reason IS DISTINCT FROM OLD.inactive_reason) THEN
    RAISE EXCEPTION 'Unauthorized: Users cannot modify administrative review or audit fields';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER check_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileges();

-- 9. TRUSTED ADMINISTRATIVE RPC FUNCTIONS
-- -----------------------------------------------------------------------------

-- 9.1 Approve Faculty Registration
CREATE OR REPLACE FUNCTION public.admin_approve_faculty(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_target_name TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;

  SELECT full_name INTO v_target_name FROM public.profiles WHERE id = target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  UPDATE public.profiles
  SET
    status = 'Active',
    approved_at = timezone('utc'::text, now()),
    approved_by = v_admin_id,
    declined_at = NULL,
    declined_by = NULL,
    declined_reason = NULL,
    declined_note = NULL
  WHERE id = target_user_id;

  INSERT INTO public.account_audit_logs (target_user_id, actor_id, action, notes)
  VALUES (target_user_id, v_admin_id, 'approve_faculty', 'Faculty account approved');

  RETURN jsonb_build_object('success', true, 'message', 'Account approved successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9.2 Decline Faculty Registration
CREATE OR REPLACE FUNCTION public.admin_decline_faculty(
  target_user_id UUID,
  reason TEXT,
  note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;

  IF reason IS NULL OR trim(reason) = '' THEN
    RAISE EXCEPTION 'A decline reason must be specified';
  END IF;

  UPDATE public.profiles
  SET
    status = 'Declined',
    declined_at = timezone('utc'::text, now()),
    declined_by = v_admin_id,
    declined_reason = reason,
    declined_note = note
  WHERE id = target_user_id;

  INSERT INTO public.account_audit_logs (target_user_id, actor_id, action, reason, notes)
  VALUES (target_user_id, v_admin_id, 'decline_faculty', reason, note);

  RETURN jsonb_build_object('success', true, 'message', 'Registration declined');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9.3 Suspend User Account
CREATE OR REPLACE FUNCTION public.admin_suspend_user(
  target_user_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;

  IF target_user_id = v_admin_id THEN
    RAISE EXCEPTION 'Operation not permitted: Cannot suspend your own administrator account';
  END IF;

  UPDATE public.profiles
  SET
    status = 'Suspended',
    suspended_at = timezone('utc'::text, now()),
    suspended_by = v_admin_id,
    suspend_reason = reason
  WHERE id = target_user_id;

  INSERT INTO public.account_audit_logs (target_user_id, actor_id, action, reason)
  VALUES (target_user_id, v_admin_id, 'suspend_account', reason);

  RETURN jsonb_build_object('success', true, 'message', 'Account suspended successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9.4 Reactivate Suspended/Inactive User Account
CREATE OR REPLACE FUNCTION public.admin_reactivate_user(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;

  UPDATE public.profiles
  SET
    status = 'Active',
    suspended_at = NULL,
    suspended_by = NULL,
    suspend_reason = NULL,
    deactivated_at = NULL,
    deactivated_by = NULL,
    inactive_reason = NULL
  WHERE id = target_user_id;

  INSERT INTO public.account_audit_logs (target_user_id, actor_id, action, notes)
  VALUES (target_user_id, v_admin_id, 'reactivate_account', 'Account reactivated to Active status');

  RETURN jsonb_build_object('success', true, 'message', 'Account reactivated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9.5 Deactivate User Account (Soft Delete / Graduation / Departure)
CREATE OR REPLACE FUNCTION public.admin_deactivate_user(
  target_user_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;

  IF target_user_id = v_admin_id THEN
    RAISE EXCEPTION 'Operation not permitted: Cannot deactivate your own administrator account';
  END IF;

  UPDATE public.profiles
  SET
    status = 'Inactive',
    deactivated_at = timezone('utc'::text, now()),
    deactivated_by = v_admin_id,
    inactive_reason = reason
  WHERE id = target_user_id;

  INSERT INTO public.account_audit_logs (target_user_id, actor_id, action, reason)
  VALUES (target_user_id, v_admin_id, 'deactivate_account', reason);

  RETURN jsonb_build_object('success', true, 'message', 'Account deactivated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9.6 Administrative Edit User Details
CREATE OR REPLACE FUNCTION public.admin_update_user_details(
  target_user_id UUID,
  new_full_name TEXT,
  new_username TEXT,
  new_role public.user_role,
  new_program TEXT DEFAULT NULL,
  new_section TEXT DEFAULT NULL,
  new_department TEXT DEFAULT NULL,
  new_position TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;

  UPDATE public.profiles
  SET
    full_name = COALESCE(new_full_name, full_name),
    username = COALESCE(new_username, username),
    role = COALESCE(new_role, role),
    program = new_program,
    section = new_section,
    department = new_department,
    position = new_position
  WHERE id = target_user_id;

  INSERT INTO public.account_audit_logs (
    target_user_id,
    actor_id,
    action,
    notes,
    metadata
  ) VALUES (
    target_user_id,
    v_admin_id,
    'edit_details',
    'Administrator edited user profile details',
    jsonb_build_object('role', new_role, 'fullName', new_full_name, 'username', new_username)
  );

  RETURN jsonb_build_object('success', true, 'message', 'User details updated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_audit_logs ENABLE ROW LEVEL SECURITY;

-- 10.1 Profiles SELECT Policy
-- Rules:
-- 1. Anonymous users: 0 rows (DENIED)
-- 2. Authenticated user can see their own profile: id = auth.uid()
-- 3. Active Administrators can view all profiles regardless of status
-- 4. Authenticated users can view active directory member profiles (name, avatar, program)
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR (status = 'Active')
  );

-- 10.2 Profiles UPDATE Policy
-- Rules:
-- 1. Non-admin users can update only their own profile details
-- 2. Trigger check_profile_privilege_escalation guards role, status, and audit fields
-- 3. Active Admins can update via trusted admin RPCs or direct admin policy
DROP POLICY IF EXISTS "profiles_user_update_policy" ON public.profiles;
CREATE POLICY "profiles_user_update_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- 10.3 Profiles INSERT Policy
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- 10.4 Profiles DELETE Policy
-- Deletions are restricted to Admins only
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
CREATE POLICY "profiles_delete_policy"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 10.5 Audit Logs Policies
-- Rules:
-- 1. SELECT: Only active Administrators can read audit history
-- 2. INSERT: Active Administrators and Security Definer RPC functions
-- 3. UPDATE / DELETE: Prohibited for ALL users (append-only ledger)
DROP POLICY IF EXISTS "audit_logs_select_admin_only" ON public.account_audit_logs;
CREATE POLICY "audit_logs_select_admin_only"
  ON public.account_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "audit_logs_insert_admin_only" ON public.account_audit_logs;
CREATE POLICY "audit_logs_insert_admin_only"
  ON public.account_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- 11. STORAGE BUCKET CONFIGURATION (Avatars)
-- -----------------------------------------------------------------------------
-- Initialize the public avatars bucket if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB file size limit for Free-tier compliance
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage RLS: Public read for avatars
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
CREATE POLICY "avatars_public_select"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Storage RLS: Authenticated users can upload to their own user folder (${auth.uid()}/*)
DROP POLICY IF EXISTS "avatars_authenticated_upload" ON storage.objects;
CREATE POLICY "avatars_authenticated_upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: Authenticated users can update/delete only their own avatar
DROP POLICY IF EXISTS "avatars_authenticated_update" ON storage.objects;
CREATE POLICY "avatars_authenticated_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

DROP POLICY IF EXISTS "avatars_authenticated_delete" ON storage.objects;
CREATE POLICY "avatars_authenticated_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

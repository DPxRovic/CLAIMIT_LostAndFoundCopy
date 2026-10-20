-- =============================================================================
-- Migration: 20261020000002_admin_management_and_status_enforcement.sql
-- Description: Administrative account lifecycle operations, status enforcement,
--              safe faculty reactivation logic, and admin password reset RPC.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. ENHANCED REACTIVATION: PRESERVES FACULTY APPROVAL REQUIREMENTS
-- -----------------------------------------------------------------------------
-- When reactivating an account:
-- If the user is Faculty and has NEVER been approved (approved_at IS NULL),
-- their status reverts to 'Pending approval', NOT 'Active'.
-- Only approved faculty, students, or staff are restored to 'Active'.
CREATE OR REPLACE FUNCTION public.admin_reactivate_user(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_role public.user_role;
  v_approved_at TIMESTAMPTZ;
  v_new_status public.account_status;
  v_msg TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;

  SELECT role, approved_at INTO v_role, v_approved_at
  FROM public.profiles
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  -- Determine target status: unapproved faculty cannot jump straight to Active
  IF v_role = 'Faculty' AND v_approved_at IS NULL THEN
    v_new_status := 'Pending approval';
    v_msg := 'Account reactivated and returned to Pending approval queue';
  ELSE
    v_new_status := 'Active';
    v_msg := 'Account reactivated to Active status';
  END IF;

  UPDATE public.profiles
  SET
    status = v_new_status,
    suspended_at = NULL,
    suspended_by = NULL,
    suspend_reason = NULL,
    deactivated_at = NULL,
    deactivated_by = NULL,
    inactive_reason = NULL
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
    'reactivate_account',
    v_msg,
    jsonb_build_object('restoredStatus', v_new_status, 'role', v_role)
  );

  RETURN jsonb_build_object('success', true, 'status', v_new_status, 'message', v_msg);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ADMINISTRATIVE TEMPORARY PASSWORD GENERATION RPC
-- -----------------------------------------------------------------------------
-- Securely sets a temporary password for a student or faculty member without
-- exposing service-role keys to the client. Uses pgcrypto's crypt().
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
  target_user_id UUID,
  temp_password TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_target_name TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;

  IF temp_password IS NULL OR length(temp_password) < 8 THEN
    RAISE EXCEPTION 'Temporary password must be at least 8 characters long';
  END IF;

  SELECT full_name INTO v_target_name FROM public.profiles WHERE id = target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  -- Authoritative password update directly in auth.users
  UPDATE auth.users
  SET
    encrypted_password = crypt(temp_password, gen_salt('bf')),
    updated_at = timezone('utc'::text, now())
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
    'reset_password',
    'Administrator generated temporary password',
    jsonb_build_object('targetUserId', target_user_id)
  );

  RETURN jsonb_build_object('success', true, 'message', 'Temporary password applied successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. STATUS-AWARE RLS ENFORCEMENT ON PROFILES
-- -----------------------------------------------------------------------------
-- Suspended or Inactive users cannot update profile records even if they hold
-- a valid non-expired JWT token.
DROP POLICY IF EXISTS "profiles_user_update_policy" ON public.profiles;
CREATE POLICY "profiles_user_update_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    ((id = auth.uid()) AND (status = 'Active'))
    OR public.is_admin()
  )
  WITH CHECK (
    ((id = auth.uid()) AND (status = 'Active'))
    OR public.is_admin()
  );

-- 4. GRANT PERMISSIONS TO AUTHENTICATED CALLERS
-- -----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.admin_reactivate_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_user_password(UUID, TEXT) TO authenticated;

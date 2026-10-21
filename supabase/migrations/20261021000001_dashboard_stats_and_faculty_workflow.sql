-- =============================================================================
-- Migration: 20261021000001_dashboard_stats_and_faculty_workflow.sql
-- Description: Authoritative dashboard statistics calculation, concurrency-safe
--              faculty approval/decline state machine, and status verification.
-- =============================================================================

-- 1. AUTHORITATIVE DASHBOARD METRICS CALCULATION RPC
-- -----------------------------------------------------------------------------
-- Returns verified counts from public.profiles with administrator authorization.
-- Strict definition:
-- - totalAccounts: Total registered user identities in public.profiles (all roles, all statuses)
-- - studentAccounts: All accounts where role = 'Student'
-- - facultyAccounts: All accounts where role = 'Faculty' (including Active & Pending approval)
-- - suspendedAccounts: All accounts where status = 'Suspended' (across all roles)
-- - pendingFaculty: Faculty applicants awaiting review (role = 'Faculty' AND status = 'Pending approval')
-- - activeAccounts: Accounts with status = 'Active'
-- - inactiveAccounts: Deactivated accounts with status = 'Inactive'
-- - declinedAccounts: Faculty applications with status = 'Declined'
CREATE OR REPLACE FUNCTION public.admin_get_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_total_accounts BIGINT;
  v_student_accounts BIGINT;
  v_faculty_accounts BIGINT;
  v_suspended_accounts BIGINT;
  v_pending_faculty BIGINT;
  v_active_accounts BIGINT;
  v_inactive_accounts BIGINT;
  v_declined_accounts BIGINT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;

  -- 1. Total Accounts
  SELECT count(*) INTO v_total_accounts FROM public.profiles;

  -- 2. Students
  SELECT count(*) INTO v_student_accounts FROM public.profiles WHERE role = 'Student';

  -- 3. Faculty
  SELECT count(*) INTO v_faculty_accounts FROM public.profiles WHERE role = 'Faculty';

  -- 4. Suspended
  SELECT count(*) INTO v_suspended_accounts FROM public.profiles WHERE status = 'Suspended';

  -- Auxiliary reconciliation counts
  SELECT count(*) INTO v_pending_faculty FROM public.profiles WHERE role = 'Faculty' AND status = 'Pending approval';
  SELECT count(*) INTO v_active_accounts FROM public.profiles WHERE status = 'Active';
  SELECT count(*) INTO v_inactive_accounts FROM public.profiles WHERE status = 'Inactive';
  SELECT count(*) INTO v_declined_accounts FROM public.profiles WHERE status = 'Declined';

  RETURN jsonb_build_object(
    'success', true,
    'totalAccounts', v_total_accounts,
    'studentAccounts', v_student_accounts,
    'facultyAccounts', v_faculty_accounts,
    'suspendedAccounts', v_suspended_accounts,
    'pendingFaculty', v_pending_faculty,
    'activeAccounts', v_active_accounts,
    'inactiveAccounts', v_inactive_accounts,
    'declinedAccounts', v_declined_accounts,
    'timestamp', timezone('utc'::text, now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. HARDENED CONCURRENCY-SAFE FACULTY APPROVAL RPC
-- -----------------------------------------------------------------------------
-- Validates:
-- - Caller must be an active administrator.
-- - Target user exists in public.profiles.
-- - Target user role must be 'Faculty'.
-- - Target user status must currently be 'Pending approval'.
-- - Row lock (FOR UPDATE) prevents race conditions and duplicate approvals.
CREATE OR REPLACE FUNCTION public.admin_approve_faculty(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_target_name TEXT;
  v_role public.user_role;
  v_status public.account_status;
  v_approved_at TIMESTAMPTZ;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;

  -- Acquire row lock and verify target profile state
  SELECT full_name, role, status, approved_at
  INTO v_target_name, v_role, v_status, v_approved_at
  FROM public.profiles
  WHERE id = target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  IF v_role != 'Faculty' THEN
    RAISE EXCEPTION 'Operation not permitted: Target account is not a faculty account (role: %)', v_role;
  END IF;

  IF v_status = 'Active' AND v_approved_at IS NOT NULL THEN
    RAISE EXCEPTION 'Faculty application has already been approved';
  END IF;

  IF v_status != 'Pending approval' THEN
    RAISE EXCEPTION 'Faculty application is no longer pending approval (current status: %)', v_status;
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

  INSERT INTO public.account_audit_logs (
    target_user_id,
    actor_id,
    action,
    notes,
    metadata
  ) VALUES (
    target_user_id,
    v_admin_id,
    'approve_faculty',
    'Faculty account approved by administrator',
    jsonb_build_object('approvedName', v_target_name)
  );

  RETURN jsonb_build_object(
    'success', true,
    'status', 'Active',
    'message', 'Faculty account approved successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. HARDENED CONCURRENCY-SAFE FACULTY DECLINE RPC
-- -----------------------------------------------------------------------------
-- Validates:
-- - Caller must be an active administrator.
-- - Decline reason must be non-empty.
-- - Target user exists in public.profiles.
-- - Target user role must be 'Faculty'.
-- - Target user status must currently be 'Pending approval'.
-- - Preserves historical records (no delete).
CREATE OR REPLACE FUNCTION public.admin_decline_faculty(
  target_user_id UUID,
  reason TEXT,
  note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_target_name TEXT;
  v_role public.user_role;
  v_status public.account_status;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;

  IF reason IS NULL OR trim(reason) = '' THEN
    RAISE EXCEPTION 'A decline reason must be specified';
  END IF;

  -- Acquire row lock and verify target profile state
  SELECT full_name, role, status
  INTO v_target_name, v_role, v_status
  FROM public.profiles
  WHERE id = target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  IF v_role != 'Faculty' THEN
    RAISE EXCEPTION 'Operation not permitted: Target account is not a faculty account (role: %)', v_role;
  END IF;

  IF v_status != 'Pending approval' THEN
    RAISE EXCEPTION 'Faculty application is no longer pending approval (current status: %)', v_status;
  END IF;

  UPDATE public.profiles
  SET
    status = 'Declined',
    declined_at = timezone('utc'::text, now()),
    declined_by = v_admin_id,
    declined_reason = trim(reason),
    declined_note = NULLIF(trim(note), '')
  WHERE id = target_user_id;

  INSERT INTO public.account_audit_logs (
    target_user_id,
    actor_id,
    action,
    reason,
    notes,
    metadata
  ) VALUES (
    target_user_id,
    v_admin_id,
    'decline_faculty',
    trim(reason),
    NULLIF(trim(note), ''),
    jsonb_build_object('declinedName', v_target_name)
  );

  RETURN jsonb_build_object(
    'success', true,
    'status', 'Declined',
    'message', 'Faculty application declined'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. GRANT PERMISSIONS TO AUTHENTICATED CALLERS
-- -----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.admin_get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_faculty(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_decline_faculty(UUID, TEXT, TEXT) TO authenticated;

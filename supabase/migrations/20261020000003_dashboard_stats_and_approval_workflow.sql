-- =============================================================================
-- Migration: 20261021000001_dashboard_stats_and_approval_workflow.sql
-- Description: Authoritative dashboard statistics calculation, concurrency-safe
--              faculty approval and decline RPCs, and status audit logging.
-- =============================================================================

-- 1. AUTHORITATIVE DASHBOARD METRICS CALCULATION
-- -----------------------------------------------------------------------------
-- Returns verified, consistent account statistics across roles and statuses.
-- Strictly accessible only by active administrators.
CREATE OR REPLACE FUNCTION public.admin_get_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
  v_total BIGINT;
  v_students BIGINT;
  v_faculty BIGINT;
  v_suspended BIGINT;
  v_pending BIGINT;
  v_active BIGINT;
  v_inactive BIGINT;
  v_declined BIGINT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE role = 'Student'),
    COUNT(*) FILTER (WHERE role = 'Faculty'),
    COUNT(*) FILTER (WHERE status = 'Suspended'),
    COUNT(*) FILTER (WHERE status = 'Pending approval'),
    COUNT(*) FILTER (WHERE status = 'Active'),
    COUNT(*) FILTER (WHERE status = 'Inactive'),
    COUNT(*) FILTER (WHERE status = 'Declined')
  INTO
    v_total,
    v_students,
    v_faculty,
    v_suspended,
    v_pending,
    v_active,
    v_inactive,
    v_declined
  FROM public.profiles;

  RETURN jsonb_build_object(
    'totalAccounts', v_total,
    'students', v_students,
    'faculty', v_faculty,
    'suspended', v_suspended,
    'pendingApproval', v_pending,
    'active', v_active,
    'inactive', v_inactive,
    'declined', v_declined
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CONCURRENCY-SAFE FACULTY APPROVAL
-- -----------------------------------------------------------------------------
-- Confirms target is currently in 'Pending approval' state and role is 'Faculty'
-- using row-level locking (FOR UPDATE) to prevent race conditions or duplicate reviews.
CREATE OR REPLACE FUNCTION public.admin_approve_faculty(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_role public.user_role;
  v_status public.account_status;
  v_target_name TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;

  -- Acquire row lock to ensure concurrency safety
  SELECT full_name, role, status INTO v_target_name, v_role, v_status
  FROM public.profiles
  WHERE id = target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  IF v_role != 'Faculty' THEN
    RAISE EXCEPTION 'Invalid operation: Only faculty accounts require approval';
  END IF;

  IF v_status != 'Pending approval' THEN
    RAISE EXCEPTION 'Faculty application is no longer pending review (current status: %)', v_status;
  END IF;

  UPDATE public.profiles
  SET
    status = 'Active',
    approved_at = timezone('utc'::text, now()),
    approved_by = v_admin_id,
    declined_at = NULL,
    declined_by = NULL,
    declined_reason = NULL,
    declined_note = NULL,
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
    'approve_faculty',
    'Faculty registration approved by administrator',
    jsonb_build_object('previous_status', v_status, 'approved_at', timezone('utc'::text, now()))
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Faculty registration approved successfully',
    'target_user_id', target_user_id,
    'status', 'Active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CONCURRENCY-SAFE FACULTY DECLINE
-- -----------------------------------------------------------------------------
-- Rejects a pending faculty registration with reason validation, preserving
-- account identity and audit records without destructive deletion.
CREATE OR REPLACE FUNCTION public.admin_decline_faculty(
  target_user_id UUID,
  reason TEXT,
  note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_role public.user_role;
  v_status public.account_status;
  v_target_name TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required';
  END IF;

  IF reason IS NULL OR trim(reason) = '' THEN
    RAISE EXCEPTION 'A valid decline reason must be specified';
  END IF;

  -- Acquire row lock to ensure concurrency safety
  SELECT full_name, role, status INTO v_target_name, v_role, v_status
  FROM public.profiles
  WHERE id = target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  IF v_role != 'Faculty' THEN
    RAISE EXCEPTION 'Invalid operation: Only faculty registrations can be declined';
  END IF;

  IF v_status != 'Pending approval' THEN
    RAISE EXCEPTION 'Faculty application is no longer pending review (current status: %)', v_status;
  END IF;

  UPDATE public.profiles
  SET
    status = 'Declined',
    declined_at = timezone('utc'::text, now()),
    declined_by = v_admin_id,
    declined_reason = trim(reason),
    declined_note = CASE WHEN note IS NOT NULL THEN trim(note) ELSE NULL END,
    updated_at = timezone('utc'::text, now())
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
    note,
    jsonb_build_object('previous_status', v_status, 'declined_at', timezone('utc'::text, now()))
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Faculty registration declined',
    'target_user_id', target_user_id,
    'status', 'Declined'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. GRANT PERMISSIONS TO AUTHENTICATED CALLERS
-- -----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.admin_get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_faculty(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_decline_faculty(UUID, TEXT, TEXT) TO authenticated;

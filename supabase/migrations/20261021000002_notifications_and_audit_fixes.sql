-- =============================================================================
-- Migration: 20261021000002_notifications_and_audit_fixes.sql
-- Description: Makes target_user_id nullable for general admin audit logs,
--              and creates the authoritative notifications table with RLS.
-- =============================================================================

-- 1. AUDIT LOG FIX: Allow general administrative / system actions without target user
-- -----------------------------------------------------------------------------
ALTER TABLE public.account_audit_logs 
  ALTER COLUMN target_user_id DROP NOT NULL;

-- 2. NOTIFICATIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  status TEXT,
  claim_id TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performant user queries and unread counting
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
CREATE POLICY "notifications_select_policy"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
CREATE POLICY "notifications_insert_policy"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL OR user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
CREATE POLICY "notifications_update_policy"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;
CREATE POLICY "notifications_delete_policy"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- 3. AUDIT LOG INSERT POLICY: Allow authenticated users to record auth & self actions
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "audit_logs_insert_admin_only" ON public.account_audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.account_audit_logs;
CREATE POLICY "audit_logs_insert_policy"
  ON public.account_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR (actor_id = auth.uid()));

-- 4. GRANTS & SCHEMA CACHE RELOAD
-- -----------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT ON public.account_audit_logs TO authenticated;

-- Notify PostgREST to reload schema cache immediately
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;


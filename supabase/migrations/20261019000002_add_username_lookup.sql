-- =============================================================================
-- Migration: 20261019000002_add_username_lookup.sql
-- Description: RPC function allowing unauthenticated login users to look up
--              the email corresponding to a username for signInWithPassword,
--              without exposing the rest of public.profiles to anonymous users.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.lookup_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF p_username IS NULL OR trim(p_username) = '' THEN
    RETURN NULL;
  END IF;

  SELECT email INTO v_email
  FROM public.profiles
  WHERE lower(username) = lower(trim(p_username))
    AND status = 'Active'
  LIMIT 1;

  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execution to both anon and authenticated users for login lookup
GRANT EXECUTE ON FUNCTION public.lookup_email_by_username(TEXT) TO anon, authenticated;

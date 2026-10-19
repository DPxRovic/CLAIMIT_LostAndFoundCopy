-- =============================================================================
-- Seed: supabase/seed.sql
-- Description: Optional sample data for local development and testing.
-- Note: Supabase Auth users must be provisioned through auth.users before
--       populating public.profiles to satisfy the foreign key constraint.
-- =============================================================================

-- Sample comments on schema usage
COMMENT ON TABLE public.profiles IS 'Campus member profiles linked to Supabase Auth identities';
COMMENT ON TABLE public.account_audit_logs IS 'Append-only ledger of administrative account lifecycle events';

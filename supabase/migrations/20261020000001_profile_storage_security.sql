-- =============================================================================
-- Migration: 20261020000001_profile_storage_security.sql
-- Description: Profile self-service management, storage security policies for the
--              'avatars' bucket, and profile modification access controls.
-- =============================================================================

-- 1. ENSURE AVATARS STORAGE BUCKET CONFIGURATION
-- -----------------------------------------------------------------------------
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

-- 2. STORAGE ROW LEVEL SECURITY POLICIES FOR AVATARS
-- -----------------------------------------------------------------------------
-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2.1 Public Read Access: Anyone can view avatar images
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
CREATE POLICY "avatars_public_select"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- 2.2 Authenticated Upload Access: User can upload only to their own directory: ${auth.uid()}/*
DROP POLICY IF EXISTS "avatars_authenticated_upload" ON storage.objects;
CREATE POLICY "avatars_authenticated_upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2.3 Authenticated Update Access: User can update only photos in their own directory, or admin
DROP POLICY IF EXISTS "avatars_authenticated_update" ON storage.objects;
CREATE POLICY "avatars_authenticated_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

-- 2.4 Authenticated Delete Access: User can delete only photos in their own directory, or admin
DROP POLICY IF EXISTS "avatars_authenticated_delete" ON storage.objects;
CREATE POLICY "avatars_authenticated_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

-- 3. PROFILES ROW LEVEL SECURITY VERIFICATION
-- -----------------------------------------------------------------------------
-- Ensure RLS is active on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Ensure own-profile update policy allows self-service updates while strictly
-- blocking tampering with unauthorized fields via the protect_profile_privileges trigger.
DROP POLICY IF EXISTS "profiles_user_update_policy" ON public.profiles;
CREATE POLICY "profiles_user_update_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

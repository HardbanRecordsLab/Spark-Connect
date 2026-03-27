-- ── Admin verification columns ──────────────────────────────────
-- Adds admin_approved / admin_rejected / rejection_reason to profiles.
-- Only profiles with admin_approved=true are shown in Discover to other users.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_approved   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_rejected   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Index for fast filtering in AdminPanel and Discover
CREATE INDEX IF NOT EXISTS profiles_admin_approved_idx
  ON public.profiles(admin_approved)
  WHERE admin_approved = true;

CREATE INDEX IF NOT EXISTS profiles_pending_idx
  ON public.profiles(admin_approved, admin_rejected)
  WHERE admin_approved = false AND admin_rejected = false;

-- ── Update Discover query to only show approved profiles ──────────
-- The useDiscoverProfiles hook already filters by profile_complete=true.
-- Add admin_approved=true to the WHERE clause (done in application code).
-- This is just documentation — the real filter is in useDiscoverProfiles.ts.

-- ── Admin role check ─────────────────────────────────────────────
-- The AdminPanel authenticates via Supabase Auth with a hardcoded email check.
-- For extra security, you can also use a custom claim:

-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
-- WHERE email = 'spark-connect@hardbanrecordslab.online';

-- ── Auto-notify admin when new profile completes onboarding ──────
-- Requires pg_net extension (enable in Supabase Dashboard → Extensions)
-- Uncomment after enabling pg_net:

-- CREATE OR REPLACE FUNCTION notify_admin_new_profile()
-- RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
-- BEGIN
--   IF NEW.profile_complete = true AND (OLD.profile_complete IS NULL OR OLD.profile_complete = false) THEN
--     PERFORM net.http_post(
--       url := current_setting('app.supabase_url') || '/functions/v1/send-push-notification',
--       headers := jsonb_build_object(
--         'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
--         'Content-Type', 'application/json'
--       ),
--       body := jsonb_build_object(
--         'admin_notification', true,
--         'message', 'Nowy profil do weryfikacji: ' || NEW.display_name
--       )
--     );
--   END IF;
--   RETURN NEW;
-- END;
-- $$;

-- DROP TRIGGER IF EXISTS on_profile_complete ON public.profiles;
-- CREATE TRIGGER on_profile_complete
--   AFTER UPDATE ON public.profiles
--   FOR EACH ROW EXECUTE FUNCTION notify_admin_new_profile();

-- ═══════════════════════════════════════════════════════════════
-- Security hardening (1/5) — Unify admin role systems
--
-- Problem: the app now has TWO parallel admin-role systems —
--   1. public.user_roles + has_role() (original, used by RLS
--      policies on reports/blacklist)
--   2. public.admin_users (added 2026-05-26, used by the new
--      check-admin Edge Function / useAuth.ts / AdminPanel.tsx)
-- admin_users starts EMPTY, so the existing admin(s) granted via
-- user_roles would be locked out of the panel after this ships.
-- This migration makes admin_users the single source of truth,
-- seeds it from the existing user_roles grants, and updates the
-- older RLS policies to also accept it.
-- ═══════════════════════════════════════════════════════════════

-- 1. Helper: is this uid a member of admin_users (any role)?
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _user_id);
$$;

-- 2. Seed admin_users from the existing user_roles admin grants and
--    the hardcoded admin emails, so nobody loses access.
INSERT INTO public.admin_users (user_id, role)
SELECT ur.user_id, 'admin'
FROM public.user_roles ur
WHERE ur.role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.admin_users (user_id, role)
SELECT u.id, 'admin'
FROM auth.users u
WHERE u.email IN ('hardbanrecordslab.pl@gmail.com', 'spark-connect@hardbanrecordslab.online')
ON CONFLICT (user_id) DO NOTHING;

-- 3. admin_users SELECT policy was `USING (true)` — any authenticated
--    user could read the full admin/moderator roster. Narrow it to
--    "read your own row, or read everything if you are yourself an
--    admin" — check-admin only ever needs the caller's own row.
DROP POLICY IF EXISTS "Authenticated users can read admin_users" ON public.admin_users;
CREATE POLICY "Users can check own admin status"
  ON public.admin_users FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin_user(auth.uid()));

-- 4. Old RLS policies keyed off has_role()/user_roles now also accept
--    admin_users, so both systems keep working during the transition.
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
CREATE POLICY "Admins can view all reports"
  ON public.reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_admin_user(auth.uid()));

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reports' AND policyname = 'Admins can update reports') THEN
    CREATE POLICY "Admins can update reports"
      ON public.reports FOR UPDATE TO authenticated
      USING (public.has_role(auth.uid(), 'admin') OR public.is_admin_user(auth.uid()))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_admin_user(auth.uid()));
  END IF;
END $$;

DROP POLICY IF EXISTS "Admins can manage blacklist" ON public.blacklist;
CREATE POLICY "Admins can manage blacklist"
  ON public.blacklist FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_admin_user(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_admin_user(auth.uid()));

-- 5. `REVOKE SELECT ON blacklist FROM authenticated` (migration
--    20260511212000) silently broke the AdminPanel blacklist tab even
--    for real admins, because PostgREST always connects as the
--    `authenticated` role — a GRANT is a prerequisite for RLS to even
--    be evaluated. RLS above already restricts rows to admins, so the
--    table-level GRANT is safe to restore.
GRANT SELECT, INSERT, DELETE ON public.blacklist TO authenticated;

-- 6. New RLS policy so admins can actually moderate OTHER users'
--    profiles (approve/reject/ban). Previously the only UPDATE policy
--    on profiles required auth.uid() = id, so AdminPanel's
--    approve/reject/ban buttons silently affected 0 rows for anyone
--    who wasn't updating their own row.
CREATE POLICY "Admins can moderate any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

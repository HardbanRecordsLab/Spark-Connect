-- ═══════════════════════════════════════════════════════════════
-- Real presence / online-count
--
-- Problem: profiles.last_online_at is set once (DEFAULT NOW()) when
-- the column was added and never updated afterward. DiscoverPage's
-- "online" badge just checks the field is non-null, so it was true
-- for effectively every profile, and the landing page's "X people
-- online" stat was a hardcoded fake number (2481). Both were
-- non-functional/dishonest social proof.
--
-- Fix: a SECURITY DEFINER function the client can call on a
-- heartbeat to bump its own last_online_at, and a public RPC
-- returning a real, live online-user count (no row-level detail
-- leaked, just an aggregate) so the landing page can show a truthful
-- number to anonymous visitors.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.heartbeat_presence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Musisz być zalogowany/a';
  END IF;

  PERFORM set_config('app.trusted_profile_write', 'on', true);
  UPDATE public.profiles SET last_online_at = now() WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.heartbeat_presence() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_online_users_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT count(*)::integer
  FROM public.profiles
  WHERE last_online_at > now() - interval '5 minutes';
$$;

GRANT EXECUTE ON FUNCTION public.get_online_users_count() TO anon, authenticated;

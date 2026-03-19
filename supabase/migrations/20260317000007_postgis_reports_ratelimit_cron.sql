-- ═══════════════════════════════════════════════════════════════
-- Migration 20260317000007 — PostGIS + Reports + Rate Limiting + Cron
-- Run: npx supabase db push
-- ═══════════════════════════════════════════════════════════════

-- ── 1. PostGIS — realna odległość GPS ────────────────────────
-- Włącz w Supabase Dashboard → Database → Extensions → postgis
-- Lub przez SQL:
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- for text search

-- Convert lat/lng columns to PostGIS geometry for fast spatial queries
-- (profiles already has lat/lng DOUBLE PRECISION from migration 0002)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);

-- Populate geom from existing lat/lng
UPDATE public.profiles
SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Index for fast geo queries
CREATE INDEX IF NOT EXISTS profiles_geom_idx
  ON public.profiles USING GIST(geom);

-- Function: update geom when lat/lng changes
CREATE OR REPLACE FUNCTION public.sync_profile_geom()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_geom ON public.profiles;
CREATE TRIGGER trg_sync_geom
  BEFORE INSERT OR UPDATE OF lat, lng ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_geom();

-- View: profiles with distance from a given point (used by Discover)
-- Usage: SELECT * FROM profiles_near_point(52.23, 21.01, 50000)
-- returns profiles within 50km of Warsaw, ordered by distance
CREATE OR REPLACE FUNCTION public.profiles_near_point(
  ref_lat  DOUBLE PRECISION,
  ref_lng  DOUBLE PRECISION,
  radius_m INTEGER DEFAULT 50000
)
RETURNS TABLE (
  id             uuid,
  display_name   text,
  age            integer,
  city           text,
  photos         text[],
  bio            text,
  interests      text[],
  relationship_type text,
  mood_status    text,
  is_verified    boolean,
  gender         text,
  orientation    text,
  avatar_url     text,
  chemistry_score smallint,
  distance_m     integer,
  admin_approved boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.display_name, p.age, p.city, p.photos, p.bio,
    p.interests, p.relationship_type, p.mood_status, p.is_verified,
    p.gender, p.orientation, p.avatar_url, p.chemistry_score,
    ST_Distance(
      p.geom::geography,
      ST_SetSRID(ST_MakePoint(ref_lng, ref_lat), 4326)::geography
    )::integer AS distance_m,
    p.admin_approved
  FROM public.profiles p
  WHERE
    p.geom IS NOT NULL
    AND p.profile_complete = true
    AND p.admin_approved = true
    AND p.id != auth.uid()
    AND ST_DWithin(
      p.geom::geography,
      ST_SetSRID(ST_MakePoint(ref_lng, ref_lat), 4326)::geography,
      radius_m
    )
  ORDER BY distance_m ASC;
END;
$$;


-- ── 2. System zgłoszeń — uzupełnij tabelę reports ──────────────
-- Tabela reports już istnieje z oryginalnych migracji.
-- Dodaj brakujące kolumny jeśli nie ma:
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'other'
    CHECK (category IN ('bot','underage','spam','harassment','fake_photos','inappropriate','other')),
  ADD COLUMN IF NOT EXISTS details  text,
  ADD COLUMN IF NOT EXISTS status   text DEFAULT 'pending'
    CHECK (status IN ('pending','reviewed','dismissed','banned')),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_reported_idx ON public.reports(reported_id);

-- ── 3. Rate limiting — tabela do śledzenia akcji ───────────────
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      text NOT NULL,  -- 'message', 'swipe', 'super_swipe', 'report'
  window_start timestamptz NOT NULL DEFAULT date_trunc('hour', now()),
  count       integer NOT NULL DEFAULT 1,
  UNIQUE(user_id, action, window_start)
);

CREATE INDEX IF NOT EXISTS rate_limits_user_action_idx
  ON public.rate_limits(user_id, action, window_start);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own rate limits"
  ON public.rate_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Function: check and increment rate limit
-- Returns true if allowed, false if limit exceeded
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_action  text,
  p_limit   integer
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_window timestamptz := date_trunc('hour', now());
  v_count  integer;
BEGIN
  INSERT INTO public.rate_limits(user_id, action, window_start, count)
  VALUES (auth.uid(), p_action, v_window, 1)
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;

-- RLS policy: limit messages (example — enforce in Edge Function or trigger)
-- Max 200 messages/hour per user
CREATE OR REPLACE FUNCTION public.enforce_message_rate_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.check_rate_limit('message', 200) THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 200 messages per hour';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_message_rate_limit ON public.messages;
CREATE TRIGGER trg_message_rate_limit
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_message_rate_limit();

-- Max 500 swipes/day per user
CREATE OR REPLACE FUNCTION public.enforce_swipe_rate_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_window timestamptz := date_trunc('day', now());
  v_count  integer;
BEGIN
  INSERT INTO public.rate_limits(user_id, action, window_start, count)
  VALUES (auth.uid(), 'swipe', v_window, 1)
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO v_count;

  IF v_count > 500 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 500 swipes per day';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_swipe_rate_limit ON public.swipes;
CREATE TRIGGER trg_swipe_rate_limit
  BEFORE INSERT ON public.swipes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_swipe_rate_limit();


-- ── 4. pg_cron — automatyczne czyszczenie ─────────────────────
-- Włącz pg_cron: Dashboard → Database → Extensions → pg_cron
-- Następnie uruchom poniższe zapytania:

-- A) Usuń wygasłe wiadomości co godzinę
-- SELECT cron.schedule(
--   'delete-expired-messages',
--   '0 * * * *',
--   $$DELETE FROM public.messages WHERE expires_at IS NOT NULL AND expires_at < now()$$
-- );

-- B) Usuń wygasłe statusy dostępności co 30 minut
-- SELECT cron.schedule(
--   'delete-expired-availability',
--   '*/30 * * * *',
--   $$DELETE FROM public.availability WHERE expires_at < now()$$
-- );

-- C) Wyczyść stare rate_limits (starsze niż 2 dni) raz dziennie
-- SELECT cron.schedule(
--   'cleanup-rate-limits',
--   '0 4 * * *',
--   $$DELETE FROM public.rate_limits WHERE window_start < now() - interval '2 days'$$
-- );

-- D) Nightly chemistry score recalculation
-- SELECT cron.schedule(
--   'chemistry-nightly',
--   '0 3 * * *',
--   $$
--     SELECT net.http_post(
--       url := current_setting('app.supabase_url') || '/functions/v1/calculate-chemistry',
--       headers := jsonb_build_object('Authorization','Bearer ' || current_setting('app.service_role_key')),
--       body := '{}'::jsonb
--     )
--   $$
-- );

-- ── QUICK SETUP: run these 4 lines after enabling pg_cron ──────
-- Replace YOUR_SUPABASE_URL and YOUR_SERVICE_ROLE_KEY:
--
-- SELECT cron.schedule('delete-expired-messages','0 * * * *',$$DELETE FROM public.messages WHERE expires_at IS NOT NULL AND expires_at < now()$$);
-- SELECT cron.schedule('delete-expired-availability','*/30 * * * *',$$DELETE FROM public.availability WHERE expires_at < now()$$);
-- SELECT cron.schedule('cleanup-rate-limits','0 4 * * *',$$DELETE FROM public.rate_limits WHERE window_start < now() - interval ''2 days''$$);

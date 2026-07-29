-- ═══════════════════════════════════════════════════════════════
-- Security hardening (4/5) — Discover privacy leak + missing indexes
--
-- Problem: the frontend (useDiscoverProfiles.ts) calls
-- profiles_near_point(ref_lat, ref_lng, radius_m, exclude_ids), but
-- the function only accepted 3 params — every call errored, so
-- Discover always fell back to `select('*')` on profiles, exposing
-- exact GPS coordinates and internal/admin columns (bot_score,
-- coin_balance, admin_rejected, ...) to every other user. Add the
-- missing parameter so the privacy-safe (distance-only) path is the
-- one that actually runs.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.profiles_near_point(
  ref_lat     DOUBLE PRECISION,
  ref_lng     DOUBLE PRECISION,
  radius_m    INTEGER DEFAULT 50000,
  exclude_ids uuid[] DEFAULT NULL
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
    AND (exclude_ids IS NULL OR p.id != ALL(exclude_ids))
    AND ST_DWithin(
      p.geom::geography,
      ST_SetSRID(ST_MakePoint(ref_lng, ref_lat), 4326)::geography,
      radius_m
    )
  ORDER BY distance_m ASC;
END;
$$;

-- ── Missing indexes flagged by the audit ─────────────────────────
CREATE INDEX IF NOT EXISTS matches_user2_idx ON public.matches(user2_id);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS swipes_swiped_idx ON public.swipes(swiped_id);

-- ── super_swipes rate limit was "handled in application code" only
-- (i.e. not at all, server-side) — add a DB-enforced abuse ceiling
-- using the same check_rate_limit() helper as messages/swipes, whose
-- window is hourly. This is a coarse anti-abuse cap (stop a script
-- from firing hundreds of super swipes in seconds/minutes), not the
-- product's "1 free + earn via ads" daily limit — that stays as
-- application-level logic on top of this floor.
CREATE OR REPLACE FUNCTION public.enforce_super_swipe_rate_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.check_rate_limit('super_swipe', 20) THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many super swipes today';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_super_swipe_rate_limit ON public.super_swipes;
CREATE TRIGGER trg_super_swipe_rate_limit
  BEFORE INSERT ON public.super_swipes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_super_swipe_rate_limit();

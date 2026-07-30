-- ═══════════════════════════════════════════════════════════════
-- Real Speed Dating
--
-- Problem: SpeedDating.tsx was entirely mock -- fake events
-- generated client-side, registration was local useState, "matching"
-- cycled through 4 hardcoded MOCK_PARTNERS with static photos (no
-- real video), and results were computed from local like state that
-- never touched the database.
--
-- Real version: real events + real registration (server-enforced
-- capacity), and for pairing/video, reuse the already-built and
-- already-verified Roulette claim-based waiting pool + LiveKit video
-- system (roulette_sessions) rather than building a parallel
-- matchmaking engine -- just scope it to an event via a nullable
-- event_id column. Reciprocal likes during a round go through the
-- same record_swipe() RPC added for core Discover matching, so a
-- speed-dating match is a REAL match, same as anywhere else.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.speed_dating_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  emoji TEXT DEFAULT '⚡',
  category TEXT DEFAULT 'Ogólny',
  start_time TIMESTAMPTZ NOT NULL,
  round_minutes INT NOT NULL DEFAULT 3,
  rounds INT NOT NULL DEFAULT 6,
  capacity INT NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.speed_dating_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Speed dating events are publicly readable" ON public.speed_dating_events;
CREATE POLICY "Speed dating events are publicly readable"
  ON public.speed_dating_events FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage speed dating events" ON public.speed_dating_events;
CREATE POLICY "Admins can manage speed dating events"
  ON public.speed_dating_events FOR ALL TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

CREATE TABLE IF NOT EXISTS public.speed_dating_registrations (
  event_id UUID NOT NULL REFERENCES public.speed_dating_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);
ALTER TABLE public.speed_dating_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Registrations are readable" ON public.speed_dating_registrations;
CREATE POLICY "Registrations are readable"
  ON public.speed_dating_registrations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can register themselves" ON public.speed_dating_registrations;
CREATE POLICY "Users can register themselves"
  ON public.speed_dating_registrations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unregister themselves" ON public.speed_dating_registrations;
CREATE POLICY "Users can unregister themselves"
  ON public.speed_dating_registrations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Server-enforced capacity -- a client-side count check alone could
-- be bypassed by calling the insert directly.
CREATE OR REPLACE FUNCTION public.check_speed_dating_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_capacity int;
  v_count int;
BEGIN
  SELECT capacity INTO v_capacity FROM public.speed_dating_events WHERE id = NEW.event_id;
  SELECT count(*) INTO v_count FROM public.speed_dating_registrations WHERE event_id = NEW.event_id;
  IF v_count >= v_capacity THEN
    RAISE EXCEPTION 'To wydarzenie jest już pełne';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_speed_dating_capacity ON public.speed_dating_registrations;
CREATE TRIGGER trg_check_speed_dating_capacity
  BEFORE INSERT ON public.speed_dating_registrations
  FOR EACH ROW EXECUTE FUNCTION public.check_speed_dating_capacity();

-- Scope the existing Roulette waiting-pool table to an optional
-- event, so speed-dating participants only get paired with other
-- people registered for the same event. NULL = ordinary Roulette.
ALTER TABLE public.roulette_sessions
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.speed_dating_events(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS roulette_sessions_event_idx ON public.roulette_sessions(event_id, status) WHERE event_id IS NOT NULL;

-- Seed a few upcoming events so the feature isn't empty on launch.
INSERT INTO public.speed_dating_events (title, emoji, category, start_time, round_minutes, rounds, capacity)
VALUES
  ('Szybka runda — dziś wieczorem', '🔥', 'Ogólny', now() + interval '2 hours', 3, 6, 30),
  ('Weekendowy Speed Dating', '🌙', '25-35 lat', now() + interval '2 days', 4, 6, 20),
  ('Speed Dating — Warszawa', '🏙️', 'Warszawa', now() + interval '5 days', 3, 8, 40);

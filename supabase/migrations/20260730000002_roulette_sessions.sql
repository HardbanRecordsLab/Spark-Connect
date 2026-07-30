-- ═══════════════════════════════════════════════════════════════
-- roulette_sessions — pairs two random online users into a shared
-- LiveKit video room for RoulettePage/SpeedDating. Referenced by the
-- livekit-token Edge Function (verifies the caller is one of the two
-- paired users and the session is still active before issuing a
-- room-scoped token).
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.roulette_sessions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status     text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'ended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at   timestamptz,
  CHECK (user_b IS NULL OR user_a <> user_b)
);

CREATE INDEX IF NOT EXISTS roulette_sessions_waiting_idx ON public.roulette_sessions(status, created_at) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS roulette_sessions_user_a_idx ON public.roulette_sessions(user_a);
CREATE INDEX IF NOT EXISTS roulette_sessions_user_b_idx ON public.roulette_sessions(user_b);

ALTER TABLE public.roulette_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their session"
  ON public.roulette_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Join the waiting pool as user_a.
CREATE POLICY "Users can start waiting"
  ON public.roulette_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_a AND user_b IS NULL AND status = 'waiting');

-- A second user may claim an open waiting session (sets themselves as
-- user_b and flips it to active), or either participant may end an
-- active session. Never lets you rewrite someone else's user_a or
-- reopen an ended session.
CREATE POLICY "Claim a waiting session or end your own"
  ON public.roulette_sessions FOR UPDATE TO authenticated
  USING (
    (status = 'waiting' AND user_b IS NULL AND auth.uid() <> user_a)
    OR (status = 'active' AND (auth.uid() = user_a OR auth.uid() = user_b))
  )
  WITH CHECK (
    (status = 'active' AND user_b = auth.uid() AND user_a <> auth.uid())
    OR (status = 'ended' AND (auth.uid() = user_a OR auth.uid() = user_b))
  );

CREATE POLICY "Users can cancel their own waiting session"
  ON public.roulette_sessions FOR DELETE TO authenticated
  USING (auth.uid() = user_a AND status = 'waiting');

-- WITH CHECK above can't compare against the pre-update row, so
-- without this a "claimer" could rewrite user_a to an arbitrary third
-- party while claiming a session (both conditions in the claim branch
-- would still hold for that fabricated value). Lock user_a/created_at
-- as immutable after insert — the only legitimate way to end up with
-- a different user_a is a fresh INSERT.
CREATE OR REPLACE FUNCTION public.lock_roulette_session_identity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.user_a := OLD.user_a;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_roulette_session_identity ON public.roulette_sessions;
CREATE TRIGGER trg_lock_roulette_session_identity
  BEFORE UPDATE ON public.roulette_sessions
  FOR EACH ROW EXECUTE FUNCTION public.lock_roulette_session_identity();

-- The original SELECT policy on roulette_sessions only let a user see
-- rows where they're already user_a/user_b — which makes matchmaking
-- impossible, since a second user needs to find an open ('waiting',
-- user_b IS NULL) session to claim it in the first place. Widen SELECT
-- to also expose the (non-sensitive: just "someone is waiting")
-- waiting-pool rows.
DROP POLICY IF EXISTS "Participants can view their session" ON public.roulette_sessions;

CREATE POLICY "Waiting pool is discoverable, own sessions always visible"
  ON public.roulette_sessions FOR SELECT TO authenticated
  USING (status = 'waiting' OR auth.uid() = user_a OR auth.uid() = user_b);

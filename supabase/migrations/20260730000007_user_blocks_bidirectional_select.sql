-- The previous migration's SELECT policy on user_blocks only allowed
-- auth.uid() = blocker_id, so a client querying "who has blocked me"
-- (blocked_id = me) got an empty result from RLS, not just empty
-- data -- silently breaking the "if A blocks B, B shouldn't see A in
-- Discover either" half of mutual exclusion. Widen SELECT to both
-- sides of the relationship; a blocked user seeing that a block row
-- exists (without any other profile detail) is an acceptable,
-- common trade-off for actually making blocking mutual.
DROP POLICY IF EXISTS "Users can see their own blocks" ON public.user_blocks;
CREATE POLICY "Users can see their own blocks"
  ON public.user_blocks FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

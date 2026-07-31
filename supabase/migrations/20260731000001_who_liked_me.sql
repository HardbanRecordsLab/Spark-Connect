-- ═══════════════════════════════════════════════════════════════
-- Real "Kto mnie polubił" (Who Liked Me)
--
-- Problem: WhoLikedMe.tsx rendered a hardcoded mock list. Now that
-- record_swipe() actually populates `swipes`, this is real data --
-- but swipes' SELECT RLS only allows seeing rows where
-- auth.uid() = swiper_id (by design: you shouldn't be able to see
-- who liked you by querying directly, that's the whole point of
-- this being a gated feature). So "who liked me" needs a SECURITY
-- DEFINER RPC, same reasoning as record_swipe's own reciprocal-like
-- check.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_who_liked_me()
RETURNS TABLE(id uuid, display_name text, age int, city text, photos text[], avatar_url text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT p.id, p.display_name, p.age, p.city, p.photos, p.avatar_url
  FROM public.swipes s
  JOIN public.profiles p ON p.id = s.swiper_id
  WHERE s.swiped_id = auth.uid()
    AND s.direction IN ('right', 'super')
    -- Exclude anyone I've already swiped on (already decided, or
    -- already matched via record_swipe -- matched pairs show up in
    -- Chats, not here).
    AND NOT EXISTS (
      SELECT 1 FROM public.swipes mine
      WHERE mine.swiper_id = auth.uid() AND mine.swiped_id = s.swiper_id
    )
  ORDER BY s.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_who_liked_me() TO authenticated;

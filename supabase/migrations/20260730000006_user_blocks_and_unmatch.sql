-- ═══════════════════════════════════════════════════════════════
-- Real block / unmatch support
--
-- Problem: the chat "..." menu shows working-looking Block, Report,
-- and Unmatch buttons, but onBlock/onReport/onUnmatch were all wired
-- to empty no-op handlers in ChatsPage.tsx -- a user hitting "Block"
-- on a harasser saw the menu close and nothing else happen, with no
-- indication it silently did nothing. Report already had a real
-- `reports` table to write to; Block and Unmatch had no schema
-- support at all (no user_blocks table, no DELETE policy on
-- matches), so this migration adds both.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS user_blocks_blocker_idx ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS user_blocks_blocked_idx ON public.user_blocks(blocked_id);

DROP POLICY IF EXISTS "Users can block others" ON public.user_blocks;
CREATE POLICY "Users can block others"
  ON public.user_blocks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can see their own blocks" ON public.user_blocks;
CREATE POLICY "Users can see their own blocks"
  ON public.user_blocks FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can unblock" ON public.user_blocks;
CREATE POLICY "Users can unblock"
  ON public.user_blocks FOR DELETE TO authenticated
  USING (auth.uid() = blocker_id);

-- Let a match participant delete (unmatch) their own match row. No
-- DELETE policy existed on matches at all, so "Unmatch" had no way
-- to work even with a real handler. conversations/messages cascade
-- via ON DELETE CASCADE already in place.
DROP POLICY IF EXISTS "Users can unmatch" ON public.matches;
CREATE POLICY "Users can unmatch"
  ON public.matches FOR DELETE TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

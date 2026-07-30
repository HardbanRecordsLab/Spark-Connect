-- ═══════════════════════════════════════════════════════════════
-- Real Archive / Mute for conversations
--
-- Problem: ChatContextMenu's Archive/Mute buttons showed
-- toast("coming soon") -- Block/Report/Unmatch were made real in an
-- earlier pass, these two were deferred. A `matches` row is shared
-- between both participants, so a plain boolean column on it can't
-- represent "archived for me but not for them" -- this needs
-- per-user state.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.match_user_state (
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  archived BOOLEAN NOT NULL DEFAULT false,
  muted BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (match_id, user_id)
);
ALTER TABLE public.match_user_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own match state" ON public.match_user_state;
CREATE POLICY "Users can read their own match state"
  ON public.match_user_state FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can set their own match state" ON public.match_user_state;
CREATE POLICY "Users can set their own match state"
  ON public.match_user_state FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own match state" ON public.match_user_state;
CREATE POLICY "Users can update their own match state"
  ON public.match_user_state FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

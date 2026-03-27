-- ── whisper_messages ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.whisper_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message     text NOT NULL CHECK (length(message) <= 200),
  is_revealed boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whisper_receiver_idx ON public.whisper_messages(receiver_id, is_revealed);
ALTER TABLE public.whisper_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sender and receiver manage whispers"
  ON public.whisper_messages FOR ALL
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ── super_swipes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.super_swipes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message     text CHECK (length(message) <= 200),
  seen        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS super_swipes_receiver_idx ON public.super_swipes(receiver_id, seen);
ALTER TABLE public.super_swipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sender and receiver manage super swipes"
  ON public.super_swipes FOR ALL
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ── story_reactions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.story_reactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id    text NOT NULL,
  reactor_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji       text NOT NULL,
  message     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(story_id, reactor_id)
);

CREATE INDEX IF NOT EXISTS story_reactions_owner_idx ON public.story_reactions(owner_id);
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactor and owner manage story reactions"
  ON public.story_reactions FOR ALL
  USING (auth.uid() = reactor_id OR auth.uid() = owner_id);

-- ── profiles: compatibility columns ───────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS compatibility_type  text,
  ADD COLUMN IF NOT EXISTS compatibility_score integer;

-- ── super_swipes daily usage tracking (per user per day) ──────
-- Handled in application code using count query:
-- SELECT count(*) FROM super_swipes
-- WHERE sender_id = $1
--   AND created_at > now() - interval '24 hours'
-- Free limit: 1 per day. Watch ad to unlock 3 more.

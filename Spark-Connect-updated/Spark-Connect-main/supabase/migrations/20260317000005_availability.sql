-- ── availability ──────────────────────────────────────────────
-- Tracks which users are currently available (spontaneous mode)
-- Records expire automatically — no cron needed, app filters by expires_at

CREATE TABLE IF NOT EXISTS public.availability (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast "who is available now" queries
CREATE INDEX IF NOT EXISTS availability_expires_idx
  ON public.availability(expires_at)
  WHERE expires_at > now();

ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see who is available
CREATE POLICY "Anyone can view availability"
  ON public.availability FOR SELECT
  TO authenticated USING (true);

-- Users manage their own availability
CREATE POLICY "Users manage own availability"
  ON public.availability FOR ALL
  USING (auth.uid() = user_id);

-- Auto-cleanup expired records (optional — run manually or via cron)
-- DELETE FROM public.availability WHERE expires_at < now();

-- ═══════════════════════════════════════════════════════════════
-- Real feature flags for AdminPanel's Settings tab
--
-- Problem: every toggle in AdminPanel > Ustawienia (Live Streaming,
-- Mapa aktywnych, Hot or Not, Otwarta rejestracja, Tryb maintenance)
-- was plain useState with no persistence -- flipping a switch did
-- nothing beyond a local re-render that reset on refresh. "Tryb
-- maintenance" is the worst offender: its own label claims it
-- "blocks access for regular users", which was entirely false.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.app_feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.app_feature_flags ENABLE ROW LEVEL SECURITY;

-- Readable by anyone (including anonymous visitors) -- maintenance
-- mode has to be checkable before a user is even logged in.
DROP POLICY IF EXISTS "Feature flags are publicly readable" ON public.app_feature_flags;
CREATE POLICY "Feature flags are publicly readable"
  ON public.app_feature_flags FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Only admins can change feature flags" ON public.app_feature_flags;
CREATE POLICY "Only admins can change feature flags"
  ON public.app_feature_flags FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Only admins can insert feature flags" ON public.app_feature_flags;
CREATE POLICY "Only admins can insert feature flags"
  ON public.app_feature_flags FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));

INSERT INTO public.app_feature_flags (key, enabled) VALUES
  ('live_streaming', true),
  ('map_nearby', true),
  ('hot_or_not', true),
  ('open_registration', true),
  ('maintenance_mode', false)
ON CONFLICT (key) DO NOTHING;

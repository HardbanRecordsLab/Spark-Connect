-- ═══════════════════════════════════════════════════════════════
-- Security hardening (5/5) — enforce 18+ at the database level
--
-- The age field had no server-side floor at all (client validation
-- was also missing — see accompanying frontend fix in
-- ProfileWizard.tsx/AuthFlow.tsx). For an 18+-only platform this must
-- hold regardless of what any client sends.
--
-- Added NOT VALID so it doesn't fail the migration if any pre-existing
-- row already violates it — run `VALIDATE CONSTRAINT profiles_age_18_plus`
-- manually after cleaning up any such rows (see rollout notes).
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_age_18_plus CHECK (age IS NULL OR age >= 18) NOT VALID;

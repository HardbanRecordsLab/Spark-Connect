-- ═══════════════════════════════════════════════════════════════
-- Security hardening (3/5) — social feed gaps
--
-- private_photo_requests, referrals, social_posts SELECT/INSERT and
-- post_likes are already fully and correctly policy'd by
-- 20260729000000_catchup_missing_schema.sql (that migration creates
-- them from scratch with the corrected design directly, since the
-- live DB never had the old broken versions of those tables/policies
-- in the first place). This file only adds what's still genuinely
-- missing: social_posts UPDATE/DELETE (only SELECT+INSERT existed
-- remotely) and all of post_comments (brand new table, no policies
-- yet — same missing-RLS problem the audit found, just never had a
-- chance to be exploited since the table didn't exist).
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='social_posts' AND policyname='Users update own posts') THEN
    CREATE POLICY "Users update own posts" ON public.social_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='social_posts' AND policyname='Users delete own posts') THEN
    CREATE POLICY "Users delete own posts" ON public.social_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE POLICY "Comments are viewable by authenticated users"
  ON public.post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own comments"
  ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own comments"
  ON public.post_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments"
  ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

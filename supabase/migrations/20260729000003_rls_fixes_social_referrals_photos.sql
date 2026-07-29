-- ═══════════════════════════════════════════════════════════════
-- Security hardening (3/5) — private photos, social feed, referrals
-- ═══════════════════════════════════════════════════════════════

-- ── private_photo_requests ───────────────────────────────────────
-- Old policy: single FOR ALL USING (requester OR owner), no WITH
-- CHECK. Since the same USING clause governs UPDATE, the requester
-- could call .update({status:'granted'}) on their OWN request row
-- and grant themselves access to someone else's private photos
-- without the owner ever approving anything.
DROP POLICY IF EXISTS "Requesters manage own requests" ON public.private_photo_requests;

CREATE POLICY "View own requests"
  ON public.private_photo_requests FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = owner_id);

CREATE POLICY "Requester creates pending request"
  ON public.private_photo_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

-- Only the photo owner may change the status (grant/reject).
CREATE POLICY "Owner decides on request"
  ON public.private_photo_requests FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Either party can remove/cancel a request.
CREATE POLICY "Either party can delete request"
  ON public.private_photo_requests FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = owner_id);

-- ── social_posts / post_likes / post_comments ────────────────────
-- These three tables never had RLS enabled at all. With the default
-- Supabase grants to `authenticated`, that means any logged-in user
-- could edit/delete anyone else's posts, forge likes/comments under
-- someone else's user_id, or wipe the whole feed.
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by authenticated users"
  ON public.social_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own posts"
  ON public.social_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own posts"
  ON public.social_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own posts"
  ON public.social_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Likes are viewable by authenticated users"
  ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own likes"
  ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own likes"
  ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Comments are viewable by authenticated users"
  ON public.post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own comments"
  ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own comments"
  ON public.post_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments"
  ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);

-- ── referrals ─────────────────────────────────────────────────────
-- Old policy "Anyone can update referee_id (claim a code)" was
-- `USING (true)` with no WITH CHECK — any authenticated user could
-- update ANY referral row, including reward_given/referrer_id/code on
-- rows that aren't theirs, enabling reward fraud or vandalism of
-- other users' referral records.
--
-- Dynamically drop whatever UPDATE policies currently exist on this
-- table (rather than guessing the exact name) and replace with a
-- correctly-scoped one.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='referrals' AND cmd = 'UPDATE') THEN
    EXECUTE (
      SELECT string_agg(format('DROP POLICY %I ON public.referrals;', policyname), ' ')
      FROM pg_policies WHERE schemaname='public' AND tablename='referrals' AND cmd = 'UPDATE'
    );
  END IF;
END $$;

-- A referral can be "claimed" (referee_id set) by the new signee once
-- (USING allows unclaimed rows, or rows you already claimed), but the
-- client can never set reward_given — only the service role can mark
-- a reward as paid out, and referrer_id/code can never change.
CREATE POLICY "Claim or update own referral as referee"
  ON public.referrals FOR UPDATE TO authenticated
  USING (referee_id IS NULL OR auth.uid() = referee_id)
  WITH CHECK (auth.uid() = referee_id AND reward_given IS NOT TRUE);

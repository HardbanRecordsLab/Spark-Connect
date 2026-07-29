-- ═══════════════════════════════════════════════════════════════
-- Catch-up migration — the production database only ever received a
-- partial, hand-applied subset of the schema described by this
-- repo's migration history (verified directly against the live DB
-- on 2026-07-29: only profiles/matches/conversations/messages/
-- post_likes/social_posts/user_roles/user_settings/blacklist
-- existed; swipes, reports, reactions, push_subscriptions,
-- chemistry_scores, referrals, private_photos,
-- private_photo_requests, availability, whisper_messages,
-- super_swipes, story_reactions, rate_limits, post_comments and
-- admin_users did not exist at all, and PostGIS was not enabled).
--
-- This migration brings the real schema up to what the application
-- code has always assumed exists, using the ORIGINAL table designs
-- from this repo's own migration files (they were correct — they
-- just never ran). Everything below is idempotent (IF NOT EXISTS /
-- guarded DO blocks) so it's safe to run even where a piece already
-- happens to exist. This must run BEFORE the 20260729000001+
-- hardening migrations, hence the 000000 timestamp.
-- ═══════════════════════════════════════════════════════════════

-- ── Extensions ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── app_role enum + has_role() ───────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- ── profiles: columns assumed by the app/migrations but missing ──
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_rejected      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rejection_reason    text,
  ADD COLUMN IF NOT EXISTS lat                 double precision,
  ADD COLUMN IF NOT EXISTS lng                 double precision,
  ADD COLUMN IF NOT EXISTS chemistry_score     smallint DEFAULT 75,
  ADD COLUMN IF NOT EXISTS compatibility_type  text,
  ADD COLUMN IF NOT EXISTS compatibility_score integer,
  ADD COLUMN IF NOT EXISTS geom                geometry(Point, 4326);

CREATE INDEX IF NOT EXISTS profiles_pending_idx ON public.profiles(admin_approved, admin_rejected) WHERE admin_approved = false AND admin_rejected = false;
CREATE INDEX IF NOT EXISTS profiles_geo_idx ON public.profiles(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

UPDATE public.profiles SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
WHERE lat IS NOT NULL AND lng IS NOT NULL AND geom IS NULL;

CREATE OR REPLACE FUNCTION public.sync_profile_geom()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_sync_geom ON public.profiles;
CREATE TRIGGER trg_sync_geom
  BEFORE INSERT OR UPDATE OF lat, lng ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_geom();

CREATE INDEX IF NOT EXISTS profiles_geom_idx ON public.profiles USING GIST(geom);

-- ── user_roles / blacklist: fix live infinite-recursion bug ──────
-- Both tables currently have a policy whose USING clause queries
-- user_roles directly (EXISTS (SELECT 1 FROM user_roles WHERE ...))
-- from WITHIN a policy defined ON user_roles itself (and blacklist's
-- policy has the same direct-query pattern) — every access recurses
-- into policy evaluation on user_roles again, erroring with
-- "infinite recursion detected in policy for relation user_roles".
-- has_role() is SECURITY DEFINER so it bypasses RLS on its internal
-- lookup instead of re-triggering policy evaluation.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='user_roles' AND cmd='ALL' LOOP
    EXECUTE format('DROP POLICY %I ON public.user_roles;', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage blacklist" ON public.blacklist;
CREATE POLICY "Admins can manage blacklist"
  ON public.blacklist FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── profiles: collapse duplicated/redundant policies ─────────────
-- Live DB accumulated 3 near-identical SELECT, 2 INSERT and 3 UPDATE
-- policies from repeated manual SQL-editor fixes. Consolidate to one
-- of each so behavior is predictable and auditable.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='profiles' LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles;', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ── swipes ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  swiped_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('left', 'right', 'super')),
  is_super BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (swiper_id, swiped_id)
);
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='swipes' AND policyname='Users can see their own swipes') THEN
    CREATE POLICY "Users can see their own swipes" ON public.swipes FOR SELECT TO authenticated USING (auth.uid() = swiper_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='swipes' AND policyname='Users can insert their own swipes') THEN
    CREATE POLICY "Users can insert their own swipes" ON public.swipes FOR INSERT TO authenticated WITH CHECK (auth.uid() = swiper_id);
  END IF;
END $$;

-- ── reports ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  category text DEFAULT 'other' CHECK (category IN ('bot','underage','spam','harassment','fake_photos','inappropriate','other')),
  details text,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed', 'reviewed', 'banned')),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_reported_idx ON public.reports(reported_id);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reports' AND policyname='Users can submit reports') THEN
    CREATE POLICY "Users can submit reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
  END IF;
END $$;
-- SELECT/UPDATE-by-admin policies for reports are created by migration 20260729000001.

-- ── reactions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON public.reactions(message_id);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reactions' AND policyname='Users can view reactions') THEN
    CREATE POLICY "Users can view reactions" ON public.reactions FOR SELECT TO authenticated USING (
      EXISTS (SELECT 1 FROM public.messages m JOIN public.conversations c ON c.id = m.conversation_id JOIN public.matches mt ON mt.id = c.match_id
        WHERE m.id = reactions.message_id AND (mt.user1_id = auth.uid() OR mt.user2_id = auth.uid())));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reactions' AND policyname='Users can add reactions') THEN
    CREATE POLICY "Users can add reactions" ON public.reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reactions' AND policyname='Users can remove own reactions') THEN
    CREATE POLICY "Users can remove own reactions" ON public.reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── push_subscriptions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='push_subscriptions' AND policyname='Users can manage own push subscriptions') THEN
    CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions FOR ALL TO authenticated
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── chemistry_scores ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chemistry_scores (
  user_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score smallint NOT NULL DEFAULT 70 CHECK (score BETWEEN 0 AND 100),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_a, user_b)
);
CREATE INDEX IF NOT EXISTS chemistry_scores_user_b_idx ON public.chemistry_scores(user_b);
ALTER TABLE public.chemistry_scores ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='chemistry_scores' AND policyname='Users can view their own chemistry scores') THEN
    CREATE POLICY "Users can view their own chemistry scores" ON public.chemistry_scores FOR SELECT TO authenticated USING (auth.uid() = user_a OR auth.uid() = user_b);
  END IF;
END $$;

-- ── referrals (correct policies from the start — no fraud window) ─
CREATE TABLE IF NOT EXISTS public.referrals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  code         text NOT NULL UNIQUE,
  clicked_at   timestamptz,
  completed_at timestamptz,
  reward_given boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS referrals_code_idx ON public.referrals(code);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='referrals' AND policyname='Users see own referrals') THEN
    CREATE POLICY "Users see own referrals" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='referrals' AND policyname='Users insert own referral code on signup') THEN
    CREATE POLICY "Users insert own referral code on signup" ON public.referrals FOR INSERT TO authenticated WITH CHECK (auth.uid() = referrer_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='referrals' AND policyname='Claim or update own referral as referee') THEN
    CREATE POLICY "Claim or update own referral as referee" ON public.referrals FOR UPDATE TO authenticated
      USING (referee_id IS NULL OR auth.uid() = referee_id)
      WITH CHECK (auth.uid() = referee_id AND reward_given IS NOT TRUE);
  END IF;
END $$;

-- ── private_photo_requests (created first — private_photos' SELECT
-- policy below references it) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.private_photo_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'rejected')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, owner_id)
);
CREATE INDEX IF NOT EXISTS ppr_owner_idx ON public.private_photo_requests(owner_id, status);
CREATE INDEX IF NOT EXISTS ppr_requester_idx ON public.private_photo_requests(requester_id);
ALTER TABLE public.private_photo_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='private_photo_requests' AND policyname='View own requests') THEN
    CREATE POLICY "View own requests" ON public.private_photo_requests FOR SELECT TO authenticated
      USING (auth.uid() = requester_id OR auth.uid() = owner_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='private_photo_requests' AND policyname='Requester creates pending request') THEN
    CREATE POLICY "Requester creates pending request" ON public.private_photo_requests FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = requester_id AND status = 'pending');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='private_photo_requests' AND policyname='Owner decides on request') THEN
    CREATE POLICY "Owner decides on request" ON public.private_photo_requests FOR UPDATE TO authenticated
      USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='private_photo_requests' AND policyname='Either party can delete request') THEN
    CREATE POLICY "Either party can delete request" ON public.private_photo_requests FOR DELETE TO authenticated
      USING (auth.uid() = requester_id OR auth.uid() = owner_id);
  END IF;
END $$;

-- ── private_photos (key column included from the start) ──────────
CREATE TABLE IF NOT EXISTS public.private_photos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key        text,
  url        text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.private_photos ADD COLUMN IF NOT EXISTS key text;
CREATE UNIQUE INDEX IF NOT EXISTS private_photos_key_idx ON public.private_photos(key);
CREATE INDEX IF NOT EXISTS private_photos_user_idx ON public.private_photos(user_id);
ALTER TABLE public.private_photos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='private_photos' AND policyname='Users manage own private photos') THEN
    CREATE POLICY "Users manage own private photos" ON public.private_photos FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='private_photos' AND policyname='Granted users can view private photos') THEN
    CREATE POLICY "Granted users can view private photos" ON public.private_photos FOR SELECT
      USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.private_photo_requests
        WHERE requester_id = auth.uid() AND owner_id = user_id AND status = 'granted'));
  END IF;
END $$;

-- ── availability ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.availability (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- (no WHERE now() here — now() is STABLE not IMMUTABLE, invalid in an index predicate)
CREATE INDEX IF NOT EXISTS availability_expires_idx ON public.availability(expires_at);
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='availability' AND policyname='Anyone can view availability') THEN
    CREATE POLICY "Anyone can view availability" ON public.availability FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='availability' AND policyname='Users manage own availability') THEN
    CREATE POLICY "Users manage own availability" ON public.availability FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── whisper_messages / super_swipes / story_reactions ─────────────
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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='whisper_messages' AND policyname='Sender and receiver manage whispers') THEN
    CREATE POLICY "Sender and receiver manage whispers" ON public.whisper_messages FOR ALL
      USING (auth.uid() = sender_id OR auth.uid() = receiver_id) WITH CHECK (auth.uid() = sender_id);
  END IF;
END $$;

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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='super_swipes' AND policyname='Sender and receiver manage super swipes') THEN
    CREATE POLICY "Sender and receiver manage super swipes" ON public.super_swipes FOR ALL
      USING (auth.uid() = sender_id OR auth.uid() = receiver_id) WITH CHECK (auth.uid() = sender_id);
  END IF;
END $$;

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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='story_reactions' AND policyname='Reactor and owner manage story reactions') THEN
    CREATE POLICY "Reactor and owner manage story reactions" ON public.story_reactions FOR ALL
      USING (auth.uid() = reactor_id OR auth.uid() = owner_id) WITH CHECK (auth.uid() = reactor_id);
  END IF;
END $$;

-- ── rate_limits + enforcement triggers for messages/swipes ────────
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT date_trunc('hour', now()),
  count       integer NOT NULL DEFAULT 1,
  UNIQUE(user_id, action, window_start)
);
CREATE INDEX IF NOT EXISTS rate_limits_user_action_idx ON public.rate_limits(user_id, action, window_start);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='rate_limits' AND policyname='Users see own rate limits') THEN
    CREATE POLICY "Users see own rate limits" ON public.rate_limits FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_action text, p_limit integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_window timestamptz := date_trunc('hour', now());
  v_count  integer;
BEGIN
  INSERT INTO public.rate_limits(user_id, action, window_start, count)
  VALUES (auth.uid(), p_action, v_window, 1)
  ON CONFLICT (user_id, action, window_start) DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO v_count;
  RETURN v_count <= p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_message_rate_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.check_rate_limit('message', 200) THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 200 messages per hour';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_message_rate_limit ON public.messages;
CREATE TRIGGER trg_message_rate_limit BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.enforce_message_rate_limit();

CREATE OR REPLACE FUNCTION public.enforce_swipe_rate_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.check_rate_limit('swipe', 500) THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 500 swipes per day';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_swipe_rate_limit ON public.swipes;
CREATE TRIGGER trg_swipe_rate_limit BEFORE INSERT ON public.swipes FOR EACH ROW EXECUTE FUNCTION public.enforce_swipe_rate_limit();

-- ── post_comments (social_posts/post_likes already exist+RLS'd) ──
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
-- Policies for post_comments (and the social_posts UPDATE/DELETE +
-- post_likes gaps) are created by migration 20260729000003.

-- ── Storage buckets used directly via supabase.storage (avatars,
-- photos galleries) by ProfileWizard.tsx — separate from the R2
-- buckets used for chat/private media.
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true) ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Anyone can view avatars') THEN
    CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can upload own avatar') THEN
    CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can update own avatar') THEN
    CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can delete own avatar') THEN
    CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Anyone can view photos') THEN
    CREATE POLICY "Anyone can view photos" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can upload own photos') THEN
    CREATE POLICY "Users can upload own photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can update own photos') THEN
    CREATE POLICY "Users can update own photos" ON storage.objects FOR UPDATE USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can delete own photos') THEN
    CREATE POLICY "Users can delete own photos" ON storage.objects FOR DELETE USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

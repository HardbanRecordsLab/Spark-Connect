-- ── Real referral tracking on profiles (separate from the pre-launch
-- waitlist's referral_code system) ─────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_no_self_referral CHECK (referred_by IS NULL OR referred_by <> id);

-- Highest ambassador milestone already reached AND paid out:
-- 0=none, 1=Pionier(1 active), 2=VIP(3 active), 3=Elite(5 active), 4=Legenda(10 active).
-- This single counter doubles as the claim-guard (never pay the same
-- milestone twice) and the permanent tier (a friend deactivating later
-- doesn't strip status someone already earned).
ALTER TABLE public.profiles ADD COLUMN referral_milestone_claimed integer NOT NULL DEFAULT 0;

-- Same protection pattern as coin_balance/donor_badge/etc: these are
-- system-computed, never directly client-writable after the row exists.
-- referred_by IS settable on the initial INSERT (ProfileWizard's first
-- upsert, capturing who invited this person) since the guard trigger
-- only fires BEFORE UPDATE -- but never changeable afterward.
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'auth' AS $function$
DECLARE
  trusted boolean;
  is_admin boolean;
BEGIN
  trusted := auth.role() = 'service_role'
    OR coalesce(current_setting('app.trusted_profile_write', true), '') = 'on';

  IF trusted THEN
    RETURN NEW;
  END IF;

  is_admin := public.is_admin_user(auth.uid());

  IF NOT is_admin THEN
    NEW.admin_approved   := OLD.admin_approved;
    NEW.admin_rejected   := OLD.admin_rejected;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.is_verified      := OLD.is_verified;
    NEW.is_bot_blocked   := OLD.is_bot_blocked;
  END IF;

  NEW.coin_balance    := OLD.coin_balance;
  NEW.bot_score        := OLD.bot_score;
  NEW.chemistry_score  := OLD.chemistry_score;
  NEW.donor_badge       := OLD.donor_badge;
  NEW.referred_by                 := OLD.referred_by;
  NEW.referral_milestone_claimed  := OLD.referral_milestone_claimed;

  RETURN NEW;
END;
$function$;

CREATE INDEX profiles_referred_by_idx ON public.profiles (referred_by) WHERE referred_by IS NOT NULL;

-- ── Real stats for the Ambassador program screen ─────────────────────
CREATE OR REPLACE FUNCTION public.get_my_referral_stats()
RETURNS TABLE(
  active_count integer,
  total_count integer,
  milestone_claimed integer,
  next_threshold integer,
  recent jsonb
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_active integer;
  v_total integer;
  v_claimed integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT count(*) FILTER (WHERE profile_complete), count(*)
    INTO v_active, v_total
  FROM public.profiles WHERE referred_by = auth.uid();

  SELECT referral_milestone_claimed INTO v_claimed FROM public.profiles WHERE id = auth.uid();

  RETURN QUERY SELECT
    v_active,
    v_total,
    v_claimed,
    (CASE WHEN v_active < 1 THEN 1 WHEN v_active < 3 THEN 3 WHEN v_active < 5 THEN 5 WHEN v_active < 10 THEN 10 ELSE NULL END),
    (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'displayName', display_name, 'avatarUrl', avatar_url,
        'active', profile_complete, 'createdAt', created_at
      ) ORDER BY created_at DESC), '[]'::jsonb)
      FROM (SELECT display_name, avatar_url, profile_complete, created_at
            FROM public.profiles WHERE referred_by = auth.uid()
            ORDER BY created_at DESC LIMIT 5) r);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_referral_stats() TO authenticated;

-- ── Real, idempotent milestone payout ────────────────────────────────
-- Re-derives the active count server-side (never trusts a client-sent
-- count), pays only newly-crossed milestones, and updates the
-- permanent claimed-tier counter so it can never be paid twice.
CREATE OR REPLACE FUNCTION public.claim_referral_milestones()
RETURNS TABLE(new_milestone integer, coins_awarded integer, new_balance integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_active integer;
  v_claimed integer;
  v_target integer;
  v_reward integer;
  v_balance integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT count(*) INTO v_active FROM public.profiles WHERE referred_by = auth.uid() AND profile_complete;
  SELECT referral_milestone_claimed INTO v_claimed FROM public.profiles WHERE id = auth.uid();

  v_target := v_claimed;
  IF v_active >= 10 AND v_claimed < 4 THEN v_target := 4; v_reward := 750;
  ELSIF v_active >= 5 AND v_claimed < 3 THEN v_target := 3; v_reward := 300;
  ELSIF v_active >= 3 AND v_claimed < 2 THEN v_target := 2; v_reward := 150;
  ELSIF v_active >= 1 AND v_claimed < 1 THEN v_target := 1; v_reward := 50;
  END IF;

  IF v_target = v_claimed THEN
    RETURN QUERY SELECT v_claimed, 0, (SELECT coin_balance FROM public.profiles WHERE id = auth.uid());
    RETURN;
  END IF;

  PERFORM set_config('app.trusted_profile_write', 'on', true);
  UPDATE public.profiles SET referral_milestone_claimed = v_target WHERE id = auth.uid();

  SELECT public.adjust_coin_balance(v_reward, 'referral_milestone_' || v_target) INTO v_balance;

  RETURN QUERY SELECT v_target, v_reward, v_balance;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_referral_milestones() TO authenticated;

-- ── Priority placement for Ambassador Elite+ (milestone 3, 5 active
-- referrals) in real geo-search results ─────────────────────────────
DROP FUNCTION IF EXISTS public.profiles_near_point(double precision, double precision, integer, uuid[]);
CREATE FUNCTION public.profiles_near_point(ref_lat double precision, ref_lng double precision, radius_m integer DEFAULT 50000, exclude_ids uuid[] DEFAULT NULL::uuid[])
RETURNS TABLE(id uuid, display_name text, age integer, city text, photos text[], bio text, interests text[], relationship_type text, mood_status text, is_verified boolean, gender text, orientation text, avatar_url text, chemistry_score smallint, distance_m integer, admin_approved boolean, is_ambassador boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.display_name, p.age, p.city, p.photos, p.bio,
    p.interests, p.relationship_type, p.mood_status, p.is_verified,
    p.gender, p.orientation, p.avatar_url, p.chemistry_score,
    ST_Distance(
      p.geom::geography,
      ST_SetSRID(ST_MakePoint(ref_lng, ref_lat), 4326)::geography
    )::integer AS distance_m,
    p.admin_approved,
    p.referral_milestone_claimed >= 3 AS is_ambassador
  FROM public.profiles p
  WHERE
    p.geom IS NOT NULL
    AND p.profile_complete = true
    AND p.admin_approved = true
    AND p.id != auth.uid()
    AND (exclude_ids IS NULL OR p.id != ALL(exclude_ids))
    AND ST_DWithin(
      p.geom::geography,
      ST_SetSRID(ST_MakePoint(ref_lng, ref_lat), 4326)::geography,
      radius_m
    )
  ORDER BY (p.referral_milestone_claimed >= 3) DESC, distance_m ASC;
END;
$function$;

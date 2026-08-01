ALTER TABLE public.profiles ADD COLUMN login_streak_count int NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN last_streak_date date;
ALTER TABLE public.profiles ADD COLUMN daily_reward_claimed_date date;

-- Called once per session for a logged-in user. Increments the streak
-- if their last recorded day was yesterday, resets to 1 if they missed
-- a day (or this is their first time), no-ops if already recorded
-- today. Returns the current streak count.
CREATE OR REPLACE FUNCTION public.record_daily_login()
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_last date;
  v_streak int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT last_streak_date, login_streak_count INTO v_last, v_streak
  FROM public.profiles WHERE id = auth.uid();

  IF v_last IS NULL OR v_last < current_date - 1 THEN
    v_streak := 1;
  ELSIF v_last = current_date - 1 THEN
    v_streak := v_streak + 1;
  END IF;
  -- if v_last = current_date, leave v_streak as-is (already recorded today)

  UPDATE public.profiles
  SET login_streak_count = v_streak, last_streak_date = current_date
  WHERE id = auth.uid();

  RETURN v_streak;
END;
$$;
GRANT EXECUTE ON FUNCTION public.record_daily_login() TO authenticated;

-- Real progress for today's challenges, computed from real tables --
-- no self-reported "mark as done" button.
CREATE OR REPLACE FUNCTION public.get_daily_challenge_progress()
RETURNS TABLE(swipes_today int, messages_today int, photos_count int, login_streak int, reward_claimed_today boolean)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT
    (SELECT count(*)::int FROM public.swipes WHERE swiper_id = auth.uid() AND created_at::date = current_date),
    (SELECT count(*)::int FROM public.messages WHERE sender_id = auth.uid() AND created_at::date = current_date),
    (SELECT coalesce(array_length(photos, 1), 0)::int FROM public.profiles WHERE id = auth.uid()),
    (SELECT login_streak_count FROM public.profiles WHERE id = auth.uid()),
    (SELECT daily_reward_claimed_date = current_date FROM public.profiles WHERE id = auth.uid());
$$;
GRANT EXECUTE ON FUNCTION public.get_daily_challenge_progress() TO authenticated;

-- Re-verifies all challenge thresholds server-side before paying out --
-- a client can't claim a reward it hasn't actually earned.
CREATE OR REPLACE FUNCTION public.claim_daily_streak_reward()
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_swipes int; v_messages int; v_photos int; v_claimed date;
  v_balance int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT daily_reward_claimed_date INTO v_claimed FROM public.profiles WHERE id = auth.uid();
  IF v_claimed = current_date THEN
    RAISE EXCEPTION 'already_claimed_today';
  END IF;

  SELECT count(*) INTO v_swipes FROM public.swipes WHERE swiper_id = auth.uid() AND created_at::date = current_date;
  SELECT count(*) INTO v_messages FROM public.messages WHERE sender_id = auth.uid() AND created_at::date = current_date;
  SELECT coalesce(array_length(photos, 1), 0) INTO v_photos FROM public.profiles WHERE id = auth.uid();

  IF v_swipes < 5 OR v_messages < 1 OR v_photos < 3 THEN
    RAISE EXCEPTION 'challenges_not_complete';
  END IF;

  UPDATE public.profiles SET daily_reward_claimed_date = current_date WHERE id = auth.uid();

  SELECT public.adjust_coin_balance(15, 'daily_streak_reward') INTO v_balance;
  RETURN v_balance;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_daily_streak_reward() TO authenticated;

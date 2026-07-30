-- ═══════════════════════════════════════════════════════════════
-- Earn coins by watching a rewarded ad — modest amount, hard daily
-- cap enforced server-side (not just a client-side timer) so it
-- can't be abused to undercut the ad-revenue-funded free model.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.claim_ad_coins()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_window    timestamptz := date_trunc('day', now());
  v_count     integer;
  v_reward    CONSTANT integer := 20;   -- coins per ad watched
  v_daily_cap CONSTANT integer := 5;    -- max claims/day (100 coins/day ceiling)
  v_balance   integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.rate_limits (user_id, action, window_start, count)
  VALUES (auth.uid(), 'ad_coins_day', v_window, 1)
  ON CONFLICT (user_id, action, window_start) DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO v_count;

  IF v_count > v_daily_cap THEN
    RAISE EXCEPTION 'Daily ad-coin limit reached (%/day) — try again tomorrow', v_daily_cap;
  END IF;

  PERFORM set_config('app.trusted_profile_write', 'on', true);

  UPDATE public.profiles
  SET coin_balance = coin_balance + v_reward
  WHERE id = auth.uid()
  RETURNING coin_balance INTO v_balance;

  INSERT INTO public.coin_transactions (user_id, delta, reason, balance_after)
  VALUES (auth.uid(), v_reward, 'ad_reward', v_balance);

  RETURN v_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_ad_coins() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_ad_coins() TO authenticated;

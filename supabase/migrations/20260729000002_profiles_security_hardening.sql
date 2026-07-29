-- ═══════════════════════════════════════════════════════════════
-- Security hardening (2/5) — profiles self-escalation
--
-- Problem: "Users can update own profile" only checks
-- `auth.uid() = id`, with no restriction on WHICH columns may
-- change. Any authenticated user could call
--   .from('profiles').update({ admin_approved: true, coin_balance: 999999, ... }).eq('id', myId)
-- and self-approve, self-verify, top up their own coin balance, or
-- clear their own bot_score — completely bypassing moderation.
--
-- Fix: a BEFORE UPDATE trigger that silently reverts changes to a
-- fixed set of privileged columns unless the actor is:
--   - the service_role (Edge Functions using the service role key), or
--   - a row in admin_users (real admins, via AdminPanel), or
--   - a trusted internal write that explicitly opted in via the
--     `app.trusted_profile_write` transaction-local setting (used by
--     the SECURITY DEFINER helper functions below).
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
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

  -- Moderation fields: only admins (via the dedicated RLS policy) or
  -- trusted/service-role writers may change these.
  IF NOT is_admin THEN
    NEW.admin_approved   := OLD.admin_approved;
    NEW.admin_rejected   := OLD.admin_rejected;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.is_verified      := OLD.is_verified;
    NEW.is_bot_blocked   := OLD.is_bot_blocked;
  END IF;

  -- System/economy fields: never client-settable, not even by admins
  -- through a raw update — these must go through the dedicated
  -- SECURITY DEFINER functions (adjust_coin_balance, calculate-chemistry,
  -- check_bot_activity) which set app.trusted_profile_write themselves.
  NEW.coin_balance   := OLD.coin_balance;
  NEW.bot_score       := OLD.bot_score;
  NEW.chemistry_score := OLD.chemistry_score;
  NEW.donor_badge      := OLD.donor_badge;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_privileged_columns ON public.profiles;
CREATE TRIGGER trg_guard_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_columns();

-- ── Make the legitimate system writers opt into the trusted bypass ──

-- increment_profile_views was SECURITY INVOKER and updated arbitrary
-- other users' rows — that already silently failed under the
-- pre-existing single-owner RLS policy. Make it SECURITY DEFINER and
-- mark the write as trusted so it actually works now that there's a
-- second (admin) UPDATE policy in play too.
CREATE OR REPLACE FUNCTION public.increment_profile_views(profile_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.trusted_profile_write', 'on', true);
  UPDATE profiles
  SET profile_views = profile_views + 1
  WHERE id = profile_id;
END;
$$;

-- check_bot_activity is currently unattached to any trigger (dead code
-- per the audit), but if it's ever wired up its internal bot_score /
-- is_bot_blocked writes need to be marked trusted too, or the new
-- guard trigger above would silently revert them right back.
CREATE OR REPLACE FUNCTION public.check_bot_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, auth
AS $$
DECLARE
    last_act timestamptz;
    diff interval;
BEGIN
    PERFORM set_config('app.trusted_profile_write', 'on', true);

    SELECT last_activity_timestamp INTO last_act FROM public.profiles WHERE id = auth.uid();
    diff := now() - last_act;

    IF diff < interval '500 milliseconds' THEN
        UPDATE public.profiles SET bot_score = bot_score + 0.1 WHERE id = auth.uid();
    ELSE
        UPDATE public.profiles SET bot_score = GREATEST(0, bot_score - 0.01) WHERE id = auth.uid();
    END IF;

    IF (SELECT bot_score FROM public.profiles WHERE id = auth.uid()) > 5.0 THEN
        UPDATE public.profiles SET is_bot_blocked = true WHERE id = auth.uid();
        RAISE EXCEPTION 'Detected automated activity. Access denied.';
    END IF;

    UPDATE public.profiles SET last_activity_timestamp = now() WHERE id = auth.uid();
    RETURN NEW;
END;
$$;

-- ── Coin economy: server-authoritative balance changes ──────────
-- Previously the coin balance was only ever changed by the client
-- (`.update({ coin_balance: newBalance })`), which is both the
-- self-escalation hole this migration closes AND the root cause of
-- a client-side NaN bug (src/hooks/useProfile.ts read a non-existent
-- `profile.coin_balance` field). This RPC is now the only legitimate
-- way to change a balance: atomic, can't go negative, audit-logged.
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta      integer NOT NULL,
  reason     text,
  balance_after integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coin_transactions_user_idx ON public.coin_transactions(user_id, created_at DESC);
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own coin transactions"
  ON public.coin_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.adjust_coin_balance(p_delta integer, p_reason text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM set_config('app.trusted_profile_write', 'on', true);

  UPDATE public.profiles
  SET coin_balance = coin_balance + p_delta
  WHERE id = auth.uid()
    AND coin_balance + p_delta >= 0
  RETURNING coin_balance INTO v_balance;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient coin balance';
  END IF;

  INSERT INTO public.coin_transactions (user_id, delta, reason, balance_after)
  VALUES (auth.uid(), p_delta, p_reason, v_balance);

  RETURN v_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_coin_balance(integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_coin_balance(integer, text) TO authenticated;

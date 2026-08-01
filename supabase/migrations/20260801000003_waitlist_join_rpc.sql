-- Direct INSERT via RLS policy hit a Postgres gotcha: RETURNING
-- (needed to hand back the generated referral_code) is evaluated
-- against SELECT policies, and waitlist only allows admins to SELECT.
-- Route writes through a SECURITY DEFINER function instead -- single
-- validated entry point, bypasses the RETURNING/SELECT policy clash,
-- and means anon no longer needs any direct table grant at all.
DROP POLICY IF EXISTS "anyone_can_join_waitlist" ON public.waitlist;

CREATE OR REPLACE FUNCTION public.join_waitlist(p_nickname text, p_email text, p_age_confirmed boolean, p_referred_by text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code text;
BEGIN
  IF NOT p_age_confirmed THEN
    RAISE EXCEPTION 'age_confirmation_required';
  END IF;

  INSERT INTO public.waitlist (nickname, email, age_confirmed, referred_by)
  VALUES (p_nickname, p_email, p_age_confirmed, p_referred_by)
  RETURNING referral_code INTO v_code;

  RETURN v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_waitlist(text, text, boolean, text) TO anon, authenticated;

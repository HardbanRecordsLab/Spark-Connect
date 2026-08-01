ALTER TABLE public.waitlist ADD COLUMN referral_code text;
UPDATE public.waitlist SET referral_code = substr(md5(gen_random_uuid()::text), 1, 8) WHERE referral_code IS NULL;
ALTER TABLE public.waitlist ALTER COLUMN referral_code SET NOT NULL;
ALTER TABLE public.waitlist ALTER COLUMN referral_code SET DEFAULT substr(md5(gen_random_uuid()::text), 1, 8);
ALTER TABLE public.waitlist ADD CONSTRAINT waitlist_referral_code_unique UNIQUE (referral_code);

ALTER TABLE public.waitlist ADD COLUMN referred_by text REFERENCES public.waitlist(referral_code);

CREATE INDEX waitlist_referred_by_idx ON public.waitlist (referred_by);

-- Returns only a count for a given referral code -- never exposes who
-- referred whom or any PII, safe to call from an unauthenticated
-- waitlist page.
CREATE OR REPLACE FUNCTION public.get_referral_count(p_code text)
RETURNS bigint
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT count(*) FROM public.waitlist WHERE referred_by = p_code;
$$;
GRANT EXECUTE ON FUNCTION public.get_referral_count(text) TO anon, authenticated;

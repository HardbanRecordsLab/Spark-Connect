CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text NOT NULL,
  email text NOT NULL,
  age_confirmed boolean NOT NULL DEFAULT false,
  consent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_email_unique UNIQUE (email),
  CONSTRAINT waitlist_age_confirmed_check CHECK (age_confirmed = true)
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Public (anon + authenticated) can join the waitlist, but cannot read it back --
-- no scraping the signup list, no confirming whether a given email already signed up.
CREATE POLICY "anyone_can_join_waitlist"
  ON public.waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view signups.
CREATE POLICY "admins_can_view_waitlist"
  ON public.waitlist FOR SELECT
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE INDEX waitlist_created_at_idx ON public.waitlist (created_at DESC);

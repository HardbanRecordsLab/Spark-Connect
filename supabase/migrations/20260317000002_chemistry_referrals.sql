-- ── chemistry_scores ────────────────────────────────────────────
-- Stores precomputed chemistry scores between user pairs.
-- Recalculated nightly by the calculate-chemistry Edge Function.
create table if not exists public.chemistry_scores (
  user_a    uuid not null references auth.users(id) on delete cascade,
  user_b    uuid not null references auth.users(id) on delete cascade,
  score     smallint not null default 70 check (score between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (user_a, user_b)
);

-- Index so we can quickly look up "all scores involving user X"
create index if not exists chemistry_scores_user_b_idx on public.chemistry_scores(user_b);

alter table public.chemistry_scores enable row level security;

create policy "Users can view their own chemistry scores"
  on public.chemistry_scores for select
  using (auth.uid() = user_a or auth.uid() = user_b);

-- Service role writes scores via Edge Function (no policy needed for service role)

-- ── referrals ────────────────────────────────────────────────────
-- Tracks who referred whom.  referrer gets a reward once referee activates.
create table if not exists public.referrals (
  id           uuid primary key default gen_random_uuid(),
  referrer_id  uuid not null references auth.users(id) on delete cascade,
  referee_id   uuid references auth.users(id) on delete set null,
  code         text not null unique,
  clicked_at   timestamptz,
  completed_at timestamptz,  -- set when referee completes onboarding
  reward_given boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists referrals_referrer_idx on public.referrals(referrer_id);
create index if not exists referrals_code_idx     on public.referrals(code);

alter table public.referrals enable row level security;

create policy "Users see own referrals"
  on public.referrals for select
  using (auth.uid() = referrer_id);

create policy "Users insert own referral code on signup"
  on public.referrals for insert
  with check (auth.uid() = referrer_id);

create policy "Anyone can update referee_id (claim a code)"
  on public.referrals for update
  using (true);

-- ── GDPR export storage bucket ───────────────────────────────────
-- Run this in SQL editor (storage buckets cannot be created via SQL migration,
-- but we add the RLS policies here for when the bucket is created via Dashboard)
-- Bucket name: gdpr-exports  (private, 10MB file limit)

-- Swipes need an is_super column if not already present
alter table public.swipes add column if not exists is_super boolean not null default false;

-- ── Profiles: add lat/lng columns for real distance calculation ──
alter table public.profiles add column if not exists lat  double precision;
alter table public.profiles add column if not exists lng  double precision;

-- Index for geographic queries (rough bounding-box)
create index if not exists profiles_lat_lng_idx on public.profiles(lat, lng)
  where lat is not null and lng is not null;

-- ── Cron: recalculate chemistry scores nightly at 03:00 UTC ──────
-- Requires pg_cron extension (enable in Supabase Dashboard → Extensions)
-- select cron.schedule(
--   'chemistry-nightly',
--   '0 3 * * *',
--   $$select net.http_post(
--     url := current_setting('app.supabase_url') || '/functions/v1/calculate-chemistry',
--     headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
--     body := '{}'::jsonb
--   )$$
-- );


-- ── profiles: add lat/lng and chemistry_score if not already present ──
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lat  DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lng  DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chemistry_score SMALLINT DEFAULT 75;

-- Index for geographic bounding-box queries
CREATE INDEX IF NOT EXISTS profiles_geo_idx
  ON public.profiles(lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

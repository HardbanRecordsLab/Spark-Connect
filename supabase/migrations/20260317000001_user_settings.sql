-- user_settings table for persisting privacy & notification toggles
-- Run this migration in your Supabase project SQL editor or via supabase db push

create table if not exists public.user_settings (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  -- Notifications
  notif_matches     boolean not null default true,
  notif_messages    boolean not null default true,
  notif_likes       boolean not null default true,
  notif_stories     boolean not null default false,
  notif_live        boolean not null default false,
  notif_promotions  boolean not null default false,
  -- Privacy
  show_last_seen    boolean not null default true,
  show_online       boolean not null default true,
  show_distance     boolean not null default true,
  read_receipts     boolean not null default true,
  invisible_mode    boolean not null default false,
  hide_from_search  boolean not null default false,
  -- Meta
  updated_at        timestamptz not null default now()
);

-- RLS: users can only read/write their own settings
alter table public.user_settings enable row level security;

create policy "Users can view own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can upsert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

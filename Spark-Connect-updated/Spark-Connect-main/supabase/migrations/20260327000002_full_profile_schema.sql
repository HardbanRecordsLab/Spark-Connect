-- ══════════════════════════════════════════════════════════════════
-- SPARKCONNECT — Full Profile Schema Migration
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- 1. CORE PROFILE COLUMNS (wizard step 1)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS height           INTEGER,
  ADD COLUMN IF NOT EXISTS body_type        TEXT,
  ADD COLUMN IF NOT EXISTS eye_color        TEXT,
  ADD COLUMN IF NOT EXISTS hair_color       TEXT,
  ADD COLUMN IF NOT EXISTS tattoos          TEXT,
  ADD COLUMN IF NOT EXISTS piercing         TEXT;

-- 2. LIFESTYLE (wizard step 2)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS smoking          TEXT,
  ADD COLUMN IF NOT EXISTS drinking         TEXT,
  ADD COLUMN IF NOT EXISTS diet             TEXT,
  ADD COLUMN IF NOT EXISTS activity_level   TEXT,
  ADD COLUMN IF NOT EXISTS day_rhythm       TEXT,
  ADD COLUMN IF NOT EXISTS pets             TEXT,
  ADD COLUMN IF NOT EXISTS housing          TEXT,
  ADD COLUMN IF NOT EXISTS education        TEXT,
  ADD COLUMN IF NOT EXISTS occupation       TEXT,
  ADD COLUMN IF NOT EXISTS mbti             TEXT,
  ADD COLUMN IF NOT EXISTS zodiac           TEXT,
  ADD COLUMN IF NOT EXISTS personality_tags TEXT[],
  ADD COLUMN IF NOT EXISTS personality_text TEXT,
  ADD COLUMN IF NOT EXISTS religion         TEXT,
  ADD COLUMN IF NOT EXISTS politics         TEXT,
  ADD COLUMN IF NOT EXISTS values_tags      TEXT[],
  ADD COLUMN IF NOT EXISTS dealbreakers     TEXT;

-- 3. PASSIONS (wizard step 3)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS passions_art     TEXT[],
  ADD COLUMN IF NOT EXISTS passions_sport   TEXT[],
  ADD COLUMN IF NOT EXISTS passions_travel  TEXT[],
  ADD COLUMN IF NOT EXISTS passions_food    TEXT[],
  ADD COLUMN IF NOT EXISTS passions_tech    TEXT[],
  ADD COLUMN IF NOT EXISTS passions_text    TEXT;

-- 4. INTENTIONS (wizard step 4)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS intentions            TEXT[],
  ADD COLUMN IF NOT EXISTS children_preference   TEXT,
  ADD COLUMN IF NOT EXISTS marriage_plans        TEXT,
  ADD COLUMN IF NOT EXISTS relocation_readiness  TEXT,
  ADD COLUMN IF NOT EXISTS relationship_style    TEXT,
  ADD COLUMN IF NOT EXISTS communication_style   TEXT[];

-- 5. ORIENTATION (wizard step 5)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS orientation          TEXT,
  ADD COLUMN IF NOT EXISTS gender_identity      TEXT,
  ADD COLUMN IF NOT EXISTS pronouns             TEXT,
  ADD COLUMN IF NOT EXISTS attracted_to         TEXT[],
  ADD COLUMN IF NOT EXISTS open_relationship    TEXT,
  ADD COLUMN IF NOT EXISTS disclosure_level     TEXT;

-- 6. INTIMATE 18+ (wizard step 6 — private)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS intimate_style    TEXT[],
  ADD COLUMN IF NOT EXISTS role_play_prefs   TEXT[],
  ADD COLUMN IF NOT EXISTS bdsm_prefs        TEXT[],
  ADD COLUMN IF NOT EXISTS exhib_prefs       TEXT[],
  ADD COLUMN IF NOT EXISTS group_prefs       TEXT[],
  ADD COLUMN IF NOT EXISTS other_prefs_18    TEXT[],
  ADD COLUMN IF NOT EXISTS sex_description   TEXT,
  ADD COLUMN IF NOT EXISTS sexual_preferences TEXT[],
  ADD COLUMN IF NOT EXISTS safe_sex          TEXT,
  ADD COLUMN IF NOT EXISTS likes_list        TEXT[],
  ADD COLUMN IF NOT EXISTS dislikes_list     TEXT[];

-- 7. LOOKING FOR (wizard step 7)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS target_age_min      INTEGER DEFAULT 18,
  ADD COLUMN IF NOT EXISTS target_age_max      INTEGER DEFAULT 99,
  ADD COLUMN IF NOT EXISTS target_gender       TEXT[],
  ADD COLUMN IF NOT EXISTS target_location     TEXT,
  ADD COLUMN IF NOT EXISTS relationship_goal   TEXT,
  ADD COLUMN IF NOT EXISTS looking_for         TEXT[],
  ADD COLUMN IF NOT EXISTS personality_match   TEXT[],
  ADD COLUMN IF NOT EXISTS dealbreakers_partner TEXT;

-- 8. PRIVACY (wizard step 9)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_visibility  TEXT DEFAULT 'Wszyscy',
  ADD COLUMN IF NOT EXISTS show_age            BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_city           BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_intimate       BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS allow_messages      TEXT DEFAULT 'Dopasowania',
  ADD COLUMN IF NOT EXISTS incognito_mode      BOOLEAN DEFAULT FALSE;

-- 9. STATS & SOCIAL
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS mood              TEXT,
  ADD COLUMN IF NOT EXISTS face_verified     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS profile_views     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_likes       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS matches_count     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_online_at    TIMESTAMPTZ DEFAULT NOW();

-- 10. INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_profiles_age_gender   ON profiles(age, gender);
CREATE INDEX IF NOT EXISTS idx_profiles_city         ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_orientation  ON profiles(orientation);
CREATE INDEX IF NOT EXISTS idx_profiles_goal         ON profiles(relationship_goal);
CREATE INDEX IF NOT EXISTS idx_profiles_last_online  ON profiles(last_online_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_verified     ON profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_complete     ON profiles(profile_complete);

-- 11. FUNCTION: increment profile views safely
CREATE OR REPLACE FUNCTION public.increment_profile_views(profile_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE profiles SET profile_views = COALESCE(profile_views, 0) + 1,
    last_online_at = NOW() WHERE id = profile_id;
END;
$$;

-- 12. FUNCTION: increment likes
CREATE OR REPLACE FUNCTION public.increment_profile_likes(profile_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE profiles SET total_likes = COALESCE(total_likes, 0) + 1 WHERE id = profile_id;
END;
$$;

-- 13. RLS: users can read all profiles, update only their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Done ✓

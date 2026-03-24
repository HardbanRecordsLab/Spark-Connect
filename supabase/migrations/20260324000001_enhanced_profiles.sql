-- Add enhanced profile attributes to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS body_type TEXT,
ADD COLUMN IF NOT EXISTS eye_color TEXT,
ADD COLUMN IF NOT EXISTS hair_color TEXT,
ADD COLUMN IF NOT EXISTS smoking TEXT,
ADD COLUMN IF NOT EXISTS drinking TEXT,
ADD COLUMN IF NOT EXISTS children TEXT,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS languages TEXT[],
ADD COLUMN IF NOT EXISTS looking_for TEXT[],
ADD COLUMN IF NOT EXISTS last_online_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add indexes for common filter combinations to improve performance
CREATE INDEX IF NOT EXISTS idx_profiles_age_gender ON profiles(age, gender);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified);

-- Add a column to track popularity (profile views/likes)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_likes INTEGER DEFAULT 0;

-- Function to increment profile views
CREATE OR REPLACE FUNCTION increment_profile_views(profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET profile_views = profile_views + 1
  WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql;

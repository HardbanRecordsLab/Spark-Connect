-- Final Premium & Privacy Update for Studio HRL Adult
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_video_url TEXT,
ADD COLUMN IF NOT EXISTS profile_theme TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS stealth_mode BOOLEAN DEFAULT FALSE;

-- Update user_settings for new features
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS allow_whispers BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS blur_nsfw_feed BOOLEAN DEFAULT TRUE;

-- Add Reels support to social_posts
ALTER TABLE social_posts
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create premium_features table to track what users have active
CREATE TABLE IF NOT EXISTS premium_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  active_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for premium search
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium) WHERE is_premium = TRUE;

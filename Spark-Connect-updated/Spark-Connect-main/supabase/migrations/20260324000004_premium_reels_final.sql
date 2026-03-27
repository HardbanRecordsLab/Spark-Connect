-- Final Privacy & Reels Update for Studio HRL Adult (Equal for everyone, no Premium)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS verification_video_url TEXT,
ADD COLUMN IF NOT EXISTS stealth_mode BOOLEAN DEFAULT FALSE;

-- Update user_settings for new features
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS allow_whispers BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS blur_nsfw_feed BOOLEAN DEFAULT TRUE;

-- Add Reels support to social_posts
ALTER TABLE social_posts
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Ensure everyone has the same rights (Equality)
-- Drop premium columns if they were accidentally created
ALTER TABLE profiles DROP COLUMN IF EXISTS is_premium;
ALTER TABLE profiles DROP COLUMN IF EXISTS premium_until;
ALTER TABLE profiles DROP COLUMN IF EXISTS profile_theme;
DROP TABLE IF EXISTS premium_features;
DROP INDEX IF EXISTS idx_profiles_is_premium;

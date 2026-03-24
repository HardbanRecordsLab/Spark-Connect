-- Add unique privacy features to user_settings
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS blur_for_unverified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS secured_mode BOOLEAN DEFAULT FALSE;

-- Secured mode could also be a column in profiles for easier access
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_secured BOOLEAN DEFAULT FALSE;

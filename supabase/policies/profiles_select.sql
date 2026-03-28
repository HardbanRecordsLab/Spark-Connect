-- Profiles can view their own profile
CREATE POLICY profiles_select_policy ON profiles
FOR SELECT
USING (auth.uid() = id)
USING (auth.role() = 'authenticated')
-- Users can view public profiles (read-only)
USING (auth.role() = 'authenticated')
WITH CHECK (true);

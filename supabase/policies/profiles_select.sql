-- Profiles can view their own profile
CREATE POLICY profiles_select_policy ON profiles
FOR SELECT
USING (auth.uid() = id)
-- Users can view public profiles
USING (auth.role() = 'authenticated')
-- Public read access for all authenticated users
WITH CHECK (true);

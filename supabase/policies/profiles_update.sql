-- Users can update their own profile
CREATE POLICY profiles_update_policy ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (true);

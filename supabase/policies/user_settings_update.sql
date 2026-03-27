-- Users can update their own settings
CREATE POLICY user_settings_update_policy ON public.user_settings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (true);

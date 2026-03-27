-- Users can view their own settings
CREATE POLICY user_settings_select_policy ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id)
USING (auth.role() = 'authenticated')
-- Users can view their own settings
USING (auth.role() = 'authenticated')
WITH CHECK (true);

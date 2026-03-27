-- Users can view likes on posts they liked
CREATE POLICY post_likes_select_policy ON public.post_likes
FOR SELECT
USING (auth.uid() = user_id)
-- Users can view their own likes
USING (auth.role() = 'authenticated')
WITH CHECK (true);

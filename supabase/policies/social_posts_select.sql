-- Users can view social posts
CREATE POLICY social_posts_select_policy ON public.social_posts
FOR SELECT
USING (auth.role() = 'authenticated')
-- Users can view social posts
USING (auth.role() = 'authenticated')
WITH CHECK (true);

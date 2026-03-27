-- Users can create social posts
CREATE POLICY social_posts_insert_policy ON public.social_posts
FOR INSERT
WITH CHECK (auth.role() = ''authenticated'');

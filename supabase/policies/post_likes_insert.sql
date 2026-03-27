-- Users can create likes
CREATE POLICY post_likes_insert_policy ON public.post_likes
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

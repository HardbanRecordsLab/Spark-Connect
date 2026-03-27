-- Users can create conversations
CREATE POLICY conversations_insert_policy ON public.conversations
FOR INSERT
WITH CHECK (auth.role() = ''authenticated'');

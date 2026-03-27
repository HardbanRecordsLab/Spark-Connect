-- Users can create messages
CREATE POLICY messages_insert_policy ON public.messages
FOR INSERT
WITH CHECK (auth.role() = ''authenticated'');

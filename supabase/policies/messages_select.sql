-- Users can view messages in their own conversations
CREATE POLICY messages_select_policy ON public.messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
USING (auth.role() = 'authenticated')
-- Users can view messages they send or receive
USING (auth.role() = 'authenticated')
WITH CHECK (true);

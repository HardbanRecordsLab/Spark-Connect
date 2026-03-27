-- Users can view their own conversations
CREATE POLICY conversations_select_policy ON public.conversations
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = participant_id)
USING (auth.role() = 'authenticated')
-- Users can view conversations they participate in
USING (auth.role() = 'authenticated')
WITH CHECK (true);

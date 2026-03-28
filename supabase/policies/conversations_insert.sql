-- Users can create conversations
DROP POLICY IF EXISTS "conversations_insert_policy" ON "public.conversations";
CREATE POLICY "conversations_insert_policy"
ON "public.conversations"
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = "user_id");

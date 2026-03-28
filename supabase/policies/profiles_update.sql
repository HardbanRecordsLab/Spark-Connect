-- UPDATE
DROP POLICY IF EXISTS "profiles_update_policy" ON "profiles";
CREATE POLICY "profiles_update_policy"
ON "profiles"
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = "id")
WITH CHECK ((select auth.uid()) = "id");

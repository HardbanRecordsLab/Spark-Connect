-- Granting admin access to specific user IDs
-- Date: 2026-03-25

-- Ensure the user_roles table exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role DEFAULT 'user' NOT NULL,
  UNIQUE(user_id, role)
);

-- Grant admin role to the provided user IDs
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('87088180-3216-4bd6-b984-226230200881', 'admin'),
  ('c17efbc5-535d-4382-a063-d009f9d7b51f', 'admin') -- ID based on previous console logs (profiles query)
ON CONFLICT (user_id, role) DO NOTHING;

-- Grant admin access for hardcoded emails if they exist
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email IN ('hardbanrecordslab.pl@gmail.com', 'spark-connect@hardbanrecordslab.online')
ON CONFLICT (user_id, role) DO NOTHING;

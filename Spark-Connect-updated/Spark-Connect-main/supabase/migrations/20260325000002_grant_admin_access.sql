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

-- Enable RLS and add policies for user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read their own roles') THEN
    CREATE POLICY "Users can read their own roles" ON public.user_roles
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all roles') THEN
    CREATE POLICY "Admins can manage all roles" ON public.user_roles
      FOR ALL USING (EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      ));
  END IF;
END $$;

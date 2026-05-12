-- Security Hardening Migration
-- Address Supabase Linter warnings (0026, 0027, 0028, 0029)
-- Date: 2026-05-11

-- 1. Hide tables from GraphQL schema while keeping them accessible via PostgREST (SDK)
COMMENT ON TABLE public.conversations IS '@graphql({"exposed": false})';
COMMENT ON TABLE public.matches IS '@graphql({"exposed": false})';
COMMENT ON TABLE public.messages IS '@graphql({"exposed": false})';
COMMENT ON TABLE public.post_likes IS '@graphql({"exposed": false})';
COMMENT ON TABLE public.profiles IS '@graphql({"exposed": false})';
COMMENT ON TABLE public.social_posts IS '@graphql({"exposed": false})';
COMMENT ON TABLE public.user_settings IS '@graphql({"exposed": false})';
COMMENT ON TABLE public.user_roles IS '@graphql({"exposed": false})';
COMMENT ON TABLE public.blacklist IS '@graphql({"exposed": false})';

-- 2. Hide functions from GraphQL/API while keeping them executable via RPC
COMMENT ON FUNCTION public.handle_post_like() IS '@graphql({"exposed": false})';
COMMENT ON FUNCTION public.increment_profile_likes(uuid) IS '@graphql({"exposed": false})';
COMMENT ON FUNCTION public.increment_profile_views(uuid) IS '@graphql({"exposed": false})';
COMMENT ON FUNCTION public.is_banned() IS '@graphql({"exposed": false})';

-- 3. Revoke all public access from anon role (Linter 0026 & 0028)
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- 4. Restrict authenticated role (Linter 0027 & 0029)
-- Revoke access to sensitive/system tables that don't need direct client access
REVOKE SELECT ON TABLE public.user_roles FROM authenticated;
REVOKE SELECT ON TABLE public.blacklist FROM authenticated;

-- Ensure RLS is enabled on critical tables
ALTER TABLE public.blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Revoke default EXECUTE from PUBLIC to prevent accidental exposure of future functions
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM authenticated;

-- 6. Grant back EXECUTE only to authenticated role for the functions the app needs to call
GRANT EXECUTE ON FUNCTION public.handle_post_like() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_profile_likes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_profile_views(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_banned() TO authenticated;
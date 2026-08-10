-- 1. Profiles: restrict SELECT to own profile or admins
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;

CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. calendar_cache: explicit least-privilege access
REVOKE ALL ON public.calendar_cache FROM anon, authenticated;
GRANT ALL ON public.calendar_cache TO service_role;

CREATE POLICY "Admins can read calendar cache"
ON public.calendar_cache FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. SECURITY DEFINER functions: remove public/anon/authenticated EXECUTE
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_access_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_lunch_menu_updated_at() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
-- authenticated must keep EXECUTE: has_role is referenced by RLS policies
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
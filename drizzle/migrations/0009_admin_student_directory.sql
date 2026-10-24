CREATE OR REPLACE FUNCTION public.admin_student_directory() RETURNS TABLE(user_id uuid, full_name text, last_sign_in_at timestamptz) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND role = 'admin') THEN
  RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
 END IF;
 RETURN QUERY SELECT p.id, COALESCE(NULLIF(p.full_name, ''), p.email, 'Elev'), u.last_sign_in_at FROM public.profiles p JOIN auth.users u ON u.id = p.id WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin') ORDER BY p.full_name;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_student_directory() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_student_directory() TO authenticated;
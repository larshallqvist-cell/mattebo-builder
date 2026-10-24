REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.student_visits FROM authenticated, anon;
REVOKE SELECT ON public.student_visits FROM anon;
GRANT SELECT ON public.student_visits TO authenticated;
GRANT ALL ON public.student_visits TO service_role;
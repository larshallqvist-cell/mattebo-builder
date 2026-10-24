CREATE TABLE public.student_visits (
 id uuid PRIMARY KEY,
 visit_id uuid NOT NULL,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 path text NOT NULL CHECK (path IN ('/', '/ak6', '/ak7', '/ak8', '/ak9', '/algebra', '/tabelltestet', '/braklabbet')),
 started_at timestamptz NOT NULL DEFAULT now(),
 last_seen_at timestamptz NOT NULL DEFAULT now(),
 active_seconds integer NOT NULL DEFAULT 0 CHECK (active_seconds BETWEEN 0 AND 28800)
);
GRANT SELECT ON public.student_visits TO authenticated;
GRANT ALL ON public.student_visits TO service_role;
ALTER TABLE public.student_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own visits or admin overview" ON public.student_visits FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE INDEX student_visits_user_time ON public.student_visits(user_id, last_seen_at DESC);
CREATE OR REPLACE FUNCTION public.record_student_visit(p_id uuid, p_visit_id uuid, p_path text, p_active_seconds integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE caller uuid := auth.uid();
BEGIN
 IF caller IS NULL OR NOT EXISTS (SELECT 1 FROM public.access_requests WHERE user_id = caller AND status = 'approved') OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = caller AND role = 'admin') THEN
  RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
 END IF;
 IF p_path NOT IN ('/', '/ak6', '/ak7', '/ak8', '/ak9', '/algebra', '/tabelltestet', '/braklabbet') OR p_active_seconds NOT BETWEEN 0 AND 28800 THEN
  RAISE EXCEPTION 'Invalid visit';
 END IF;
 INSERT INTO public.student_visits(id, visit_id, user_id, path) VALUES (p_id, p_visit_id, caller, p_path) ON CONFLICT (id) DO NOTHING;
 UPDATE public.student_visits SET last_seen_at = now(), active_seconds = GREATEST(active_seconds, LEAST(p_active_seconds, FLOOR(EXTRACT(EPOCH FROM (now() - started_at)))::integer + 5)) WHERE id = p_id AND user_id = caller AND visit_id = p_visit_id AND path = p_path;
END;
$$;
REVOKE ALL ON FUNCTION public.record_student_visit(uuid, uuid, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_student_visit(uuid, uuid, text, integer) TO authenticated;
CREATE POLICY "Admins read resource activity" ON public.activity_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins read mission progress" ON public.braklabbet_progress FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
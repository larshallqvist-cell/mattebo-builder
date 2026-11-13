CREATE TABLE public.kistan_progress (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level_id text NOT NULL CHECK (level_id ~ '^[1-9]-[0-9]{1,2}$'),
  stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 3),
  best_moves integer NOT NULL CHECK (best_moves BETWEEN 0 AND 500),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, level_id)
);

GRANT SELECT, INSERT, UPDATE ON public.kistan_progress TO authenticated;
GRANT ALL ON public.kistan_progress TO service_role;

ALTER TABLE public.kistan_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users insert own kistan progress" ON public.kistan_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    OR EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved')));

CREATE POLICY "Approved users update own kistan progress" ON public.kistan_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    OR EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved')));

CREATE POLICY "Own kistan progress or admin reads all" ON public.kistan_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE OR REPLACE FUNCTION public.record_student_visit(p_id uuid, p_visit_id uuid, p_path text, p_active_seconds integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE caller uuid := auth.uid();
BEGIN
 IF caller IS NULL OR NOT EXISTS (SELECT 1 FROM public.access_requests WHERE user_id = caller AND status = 'approved') OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = caller AND role = 'admin') THEN
  RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
 END IF;
 IF p_path NOT IN ('/', '/ak6', '/ak7', '/ak8', '/ak9', '/algebra', '/tabelltestet', '/braklabbet', '/procent', '/ekvationer', '/koordinater', '/kistan') OR p_active_seconds NOT BETWEEN 0 AND 28800 THEN
  RAISE EXCEPTION 'Invalid visit';
 END IF;
 INSERT INTO public.student_visits(id, visit_id, user_id, path) VALUES (p_id, p_visit_id, caller, p_path) ON CONFLICT (id) DO NOTHING;
 UPDATE public.student_visits SET last_seen_at = now(), active_seconds = GREATEST(active_seconds, LEAST(p_active_seconds, FLOOR(EXTRACT(EPOCH FROM (now() - started_at)))::integer + 5)) WHERE id = p_id AND user_id = caller AND visit_id = p_visit_id AND path = p_path;
END;
$function$;
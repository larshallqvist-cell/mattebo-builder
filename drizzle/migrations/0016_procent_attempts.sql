CREATE TABLE public.procent_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('triangel','faktor')),
  level smallint NOT NULL CHECK (level BETWEEN 0 AND 2),
  task_kind text NOT NULL CHECK (task_kind IN ('andel','delen','hela','okning','minskning')),
  hint_used boolean NOT NULL DEFAULT false,
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX procent_attempts_user_idx ON public.procent_attempts(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.procent_attempts TO authenticated;
GRANT ALL ON public.procent_attempts TO service_role;
ALTER TABLE public.procent_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved users insert own procent attempts" ON public.procent_attempts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved')));
CREATE POLICY "Own procent attempts or admin reads all" ON public.procent_attempts FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

ALTER TABLE public.student_visits DROP CONSTRAINT student_visits_path_check;
ALTER TABLE public.student_visits ADD CONSTRAINT student_visits_path_check CHECK (path IN ('/', '/ak6', '/ak7', '/ak8', '/ak9', '/algebra', '/tabelltestet', '/braklabbet', '/procent'));

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
 IF p_path NOT IN ('/', '/ak6', '/ak7', '/ak8', '/ak9', '/algebra', '/tabelltestet', '/braklabbet', '/procent') OR p_active_seconds NOT BETWEEN 0 AND 28800 THEN
  RAISE EXCEPTION 'Invalid visit';
 END IF;
 INSERT INTO public.student_visits(id, visit_id, user_id, path) VALUES (p_id, p_visit_id, caller, p_path) ON CONFLICT (id) DO NOTHING;
 UPDATE public.student_visits SET last_seen_at = now(), active_seconds = GREATEST(active_seconds, LEAST(p_active_seconds, FLOOR(EXTRACT(EPOCH FROM (now() - started_at)))::integer + 5)) WHERE id = p_id AND user_id = caller AND visit_id = p_visit_id AND path = p_path;
END;
$function$;
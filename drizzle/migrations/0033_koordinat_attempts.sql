CREATE TABLE public.koordinat_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('las', 'mix')),
  level smallint NOT NULL CHECK (level BETWEEN 0 AND 5),
  task_kind text NOT NULL CHECK (task_kind IN ('read', 'place')),
  hint_used boolean NOT NULL DEFAULT false,
  is_correct boolean NOT NULL,
  error_kind text CHECK (error_kind IN ('swapped', 'sign', 'other')),
  streak integer NOT NULL DEFAULT 0 CHECK (streak >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX koordinat_attempts_user_mode_idx ON public.koordinat_attempts (user_id, mode, streak DESC);

GRANT SELECT, INSERT ON public.koordinat_attempts TO authenticated;
GRANT ALL ON public.koordinat_attempts TO service_role;

ALTER TABLE public.koordinat_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users insert own koordinat attempts" ON public.koordinat_attempts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    OR EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved')));

CREATE POLICY "Own koordinat attempts or admin reads all" ON public.koordinat_attempts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE OR REPLACE FUNCTION public.koordinat_leaderboard(p_mode text)
 RETURNS TABLE(scope smallint, place integer, name text, best integer, is_me boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE caller uuid := auth.uid();
BEGIN
 IF caller IS NULL OR NOT (
   EXISTS (SELECT 1 FROM public.access_requests WHERE user_id = caller AND status = 'approved')
   OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = caller AND role = 'admin')
 ) THEN
  RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
 END IF;
 IF p_mode NOT IN ('las', 'mix') THEN
  RAISE EXCEPTION 'Invalid mode';
 END IF;
 RETURN QUERY
 WITH bests AS (
   SELECT a.user_id, max(a.streak) AS best
   FROM public.koordinat_attempts a
   WHERE a.mode = p_mode AND a.streak > 0
   GROUP BY a.user_id
 ), reached AS (
   SELECT b.user_id, b.best, min(a.created_at) AS reached_at
   FROM bests b JOIN public.koordinat_attempts a ON a.user_id = b.user_id AND a.mode = p_mode AND a.streak = b.best
   GROUP BY b.user_id, b.best
 ), students AS (
   SELECT r.user_id, r.best, r.reached_at, p.class_grade,
     trim(split_part(trim(coalesce(p.full_name, '')), ' ', 1) || CASE WHEN split_part(trim(coalesce(p.full_name, '')), ' ', 2) <> ''
       THEN ' ' || upper(left(split_part(trim(p.full_name), ' ', 2), 1)) || '.' ELSE '' END) AS short_name
   FROM reached r JOIN public.profiles p ON p.id = r.user_id
   WHERE p.class_grade BETWEEN 6 AND 9
     AND EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = r.user_id AND ar.status = 'approved')
     AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = r.user_id AND ur.role = 'admin')
 ), ranked AS (
   SELECT s.*, row_number() OVER (ORDER BY s.best DESC, s.reached_at) AS school_place,
     row_number() OVER (PARTITION BY s.class_grade ORDER BY s.best DESC, s.reached_at) AS class_place
   FROM students s
 )
 SELECT 0::smallint, x.school_place::integer, coalesce(nullif(x.short_name, ''), 'Elev'), x.best, x.user_id = caller FROM ranked x WHERE x.school_place <= 10
 UNION ALL
 SELECT x.class_grade::smallint, x.class_place::integer, coalesce(nullif(x.short_name, ''), 'Elev'), x.best, x.user_id = caller FROM ranked x WHERE x.class_place <= 3
 ORDER BY 1, 2;
END;
$function$;
REVOKE ALL ON FUNCTION public.koordinat_leaderboard(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.koordinat_leaderboard(text) TO authenticated, service_role;

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
 IF p_path NOT IN ('/', '/ak6', '/ak7', '/ak8', '/ak9', '/algebra', '/tabelltestet', '/braklabbet', '/procent', '/ekvationer', '/koordinater') OR p_active_seconds NOT BETWEEN 0 AND 28800 THEN
  RAISE EXCEPTION 'Invalid visit';
 END IF;
 INSERT INTO public.student_visits(id, visit_id, user_id, path) VALUES (p_id, p_visit_id, caller, p_path) ON CONFLICT (id) DO NOTHING;
 UPDATE public.student_visits SET last_seen_at = now(), active_seconds = GREATEST(active_seconds, LEAST(p_active_seconds, FLOOR(EXTRACT(EPOCH FROM (now() - started_at)))::integer + 5)) WHERE id = p_id AND user_id = caller AND visit_id = p_visit_id AND path = p_path;
END;
$function$;
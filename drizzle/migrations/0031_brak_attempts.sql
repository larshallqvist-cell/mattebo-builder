CREATE TABLE public.brak_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('form','forlang','mgn','addsub','mult','div','mix')),
  level smallint NOT NULL CHECK (level BETWEEN 0 AND 5),
  task_kind text NOT NULL,
  is_correct boolean NOT NULL,
  points numeric(3,2) NOT NULL DEFAULT 0 CHECK (points >= 0 AND points <= 1),
  unsimplified boolean NOT NULL DEFAULT false,
  calculator_used boolean NOT NULL DEFAULT false,
  hint_used boolean NOT NULL DEFAULT false,
  streak integer NOT NULL DEFAULT 0 CHECK (streak >= 0),
  streak_points numeric(8,2) NOT NULL DEFAULT 0 CHECK (streak_points >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX brak_attempts_user_idx ON public.brak_attempts(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.brak_attempts TO authenticated;
GRANT ALL ON public.brak_attempts TO service_role;
ALTER TABLE public.brak_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved users insert own brak attempts" ON public.brak_attempts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved')));
CREATE POLICY "Own brak attempts or admin reads all" ON public.brak_attempts FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE OR REPLACE FUNCTION public.brak_leaderboard()
RETURNS TABLE(scope smallint, place integer, name text, best numeric, is_me boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE caller uuid := auth.uid();
BEGIN
 IF caller IS NULL OR NOT (
   EXISTS (SELECT 1 FROM public.access_requests WHERE user_id = caller AND status = 'approved')
   OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = caller AND role = 'admin')
 ) THEN
  RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
 END IF;
 RETURN QUERY
 WITH bests AS (
   SELECT a.user_id, max(a.streak_points) AS best FROM public.brak_attempts a WHERE a.streak_points > 0 GROUP BY a.user_id
 ), reached AS (
   SELECT b.user_id, b.best, min(a.created_at) AS reached_at
   FROM bests b JOIN public.brak_attempts a ON a.user_id = b.user_id AND a.streak_points = b.best
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
REVOKE ALL ON FUNCTION public.brak_leaderboard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.brak_leaderboard() TO authenticated, service_role;
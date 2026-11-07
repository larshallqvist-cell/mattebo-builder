CREATE OR REPLACE FUNCTION public.procent_leaderboard(p_mode text)
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
 IF p_mode NOT IN ('mangd', 'faktormangd') THEN
  RAISE EXCEPTION 'Invalid mode';
 END IF;
 RETURN QUERY
 WITH bests AS (
   SELECT a.user_id, max(a.streak) AS best
   FROM public.procent_attempts a
   WHERE a.mode = p_mode AND a.streak > 0
   GROUP BY a.user_id
 ), reached AS (
   SELECT b.user_id, b.best, min(a.created_at) AS reached_at
   FROM bests b JOIN public.procent_attempts a ON a.user_id = b.user_id AND a.mode = p_mode AND a.streak = b.best
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

REVOKE ALL ON FUNCTION public.procent_leaderboard(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.procent_leaderboard(text) TO authenticated, service_role;
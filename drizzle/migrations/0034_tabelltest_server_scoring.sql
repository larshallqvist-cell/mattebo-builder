CREATE TABLE public.tabelltest_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  input_mode text NOT NULL CHECK (input_mode IN ('voice', 'keyboard')),
  questions jsonb NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX tabelltest_sessions_user_idx ON public.tabelltest_sessions (user_id, started_at DESC);

GRANT ALL ON public.tabelltest_sessions TO service_role;
ALTER TABLE public.tabelltest_sessions ENABLE ROW LEVEL SECURITY;
-- No client policies: sessions are only touched by the scoring RPCs below.

-- Results can no longer be inserted directly by clients.
DROP POLICY IF EXISTS "Approved users insert own results" ON public.tabelltest_results;
REVOKE INSERT, UPDATE, DELETE ON public.tabelltest_results FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.start_tabelltest(p_input_mode text)
 RETURNS jsonb
 LANGUAGE plpgsql
 VOLATILE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  caller uuid := auth.uid();
  qs jsonb;
  sid uuid;
BEGIN
  IF caller IS NULL OR NOT (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = caller AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.access_requests WHERE user_id = caller AND status = 'approved')
  ) THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  IF p_input_mode NOT IN ('voice', 'keyboard') THEN
    RAISE EXCEPTION 'invalid input mode' USING ERRCODE = '22023';
  END IF;

  SELECT jsonb_agg(jsonb_build_object('a', a, 'b', b))
    INTO qs
    FROM (
      SELECT a, b FROM generate_series(2, 9) a CROSS JOIN generate_series(1, 10) b
      ORDER BY random() LIMIT 20
    ) q;

  INSERT INTO public.tabelltest_sessions (user_id, input_mode, questions)
  VALUES (caller, p_input_mode, qs)
  RETURNING id INTO sid;

  RETURN jsonb_build_object('session_id', sid, 'questions', qs);
END;
$function$;

CREATE OR REPLACE FUNCTION public.finish_tabelltest(p_session_id uuid, p_answers integer[], p_times_ms integer[])
 RETURNS jsonb
 LANGUAGE plpgsql
 VOLATILE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  caller uuid := auth.uid();
  s public.tabelltest_sessions%ROWTYPE;
  n integer;
  i integer;
  v_score integer := 0;
  v_sum bigint := 0;
  v_avg integer;
  v_wall_avg integer;
  v_limit integer;
  v_passed boolean;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO s FROM public.tabelltest_sessions
   WHERE id = p_session_id AND user_id = caller
   FOR UPDATE;
  IF NOT FOUND OR s.finished_at IS NOT NULL OR s.started_at < now() - interval '30 minutes' THEN
    RAISE EXCEPTION 'invalid session' USING ERRCODE = '22023';
  END IF;

  n := jsonb_array_length(s.questions);
  IF coalesce(array_length(p_answers, 1), 0) <> n OR coalesce(array_length(p_times_ms, 1), 0) <> n THEN
    RAISE EXCEPTION 'invalid answers' USING ERRCODE = '22023';
  END IF;

  FOR i IN 1..n LOOP
    IF p_answers[i] IS NOT NULL
       AND p_answers[i] = (s.questions->(i-1)->>'a')::int * (s.questions->(i-1)->>'b')::int THEN
      v_score := v_score + 1;
    END IF;
    v_sum := v_sum + least(greatest(coalesce(p_times_ms[i], 60000), 0), 60000);
  END LOOP;

  -- Reported times can never be faster than the real server-side elapsed time (3 s slack for network).
  v_avg := round(v_sum::numeric / n);
  v_wall_avg := greatest(0, floor((extract(epoch FROM (now() - s.started_at)) * 1000 - 3000) / n))::int;
  v_avg := greatest(v_avg, v_wall_avg);

  v_limit := CASE WHEN s.input_mode = 'keyboard' THEN 2700 ELSE 1700 END;
  v_passed := v_score >= 18 AND v_avg <= v_limit;

  UPDATE public.tabelltest_sessions SET finished_at = now() WHERE id = s.id;

  INSERT INTO public.tabelltest_results (user_id, score, total, avg_time_ms, passed, input_mode)
  VALUES (caller, v_score, n, v_avg, v_passed, s.input_mode);

  RETURN jsonb_build_object('score', v_score, 'total', n, 'avg_time_ms', v_avg, 'passed', v_passed);
END;
$function$;

REVOKE ALL ON FUNCTION public.start_tabelltest(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.finish_tabelltest(uuid, integer[], integer[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_tabelltest(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_tabelltest(uuid, integer[], integer[]) TO authenticated;
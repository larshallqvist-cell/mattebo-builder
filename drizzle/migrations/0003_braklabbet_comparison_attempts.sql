CREATE TABLE public.braklabbet_attempts (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 exercise_id integer NOT NULL CHECK (exercise_id BETWEEN 1 AND 20),
 answer text NOT NULL CHECK (char_length(answer) BETWEEN 1 AND 2000),
 is_correct boolean NOT NULL,
 attempt_number integer NOT NULL CHECK (attempt_number > 0),
 hint_used boolean NOT NULL DEFAULT false,
 answered_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id, exercise_id, attempt_number)
);
GRANT SELECT ON public.braklabbet_attempts TO authenticated;
GRANT ALL ON public.braklabbet_attempts TO service_role;
ALTER TABLE public.braklabbet_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own fraction answers or admin overview" ON public.braklabbet_attempts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX braklabbet_attempts_user_time ON public.braklabbet_attempts(user_id, answered_at DESC);
CREATE FUNCTION public.record_braklabbet_attempt(p_id uuid, p_user_id uuid, p_exercise_id integer, p_answer text, p_is_correct boolean, p_hint_used boolean)
RETURNS public.braklabbet_attempts LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result public.braklabbet_attempts; next_attempt integer;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_exercise_id::text, 0));
 SELECT * INTO result FROM public.braklabbet_attempts WHERE id = p_id AND user_id = p_user_id;
 IF FOUND THEN RETURN result; END IF;
 SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO next_attempt FROM public.braklabbet_attempts WHERE user_id = p_user_id AND exercise_id = p_exercise_id;
 INSERT INTO public.braklabbet_attempts(id,user_id,exercise_id,answer,is_correct,attempt_number,hint_used) VALUES(p_id,p_user_id,p_exercise_id,p_answer,p_is_correct,next_attempt,p_hint_used) RETURNING * INTO result;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.record_braklabbet_attempt(uuid,uuid,integer,text,boolean,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_braklabbet_attempt(uuid,uuid,integer,text,boolean,boolean) TO service_role;
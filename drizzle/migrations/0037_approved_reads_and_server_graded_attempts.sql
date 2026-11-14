-- Own-record reads require current approval (admins read all).
DROP POLICY IF EXISTS "Users can read own activity" ON public.activity_logs;
CREATE POLICY "Approved users read own activity" ON public.activity_logs FOR SELECT TO authenticated
USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved'));

DROP POLICY IF EXISTS "Users read own mission progress" ON public.braklabbet_progress;
CREATE POLICY "Approved users read own mission progress" ON public.braklabbet_progress FOR SELECT TO authenticated
USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved'));

DROP POLICY IF EXISTS "Read own fraction answers or admin overview" ON public.braklabbet_attempts;
CREATE POLICY "Read own fraction answers or admin overview" ON public.braklabbet_attempts FOR SELECT TO authenticated
USING (
  (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved'))
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Own ekvation attempts or admin reads all" ON public.ekvation_attempts;
CREATE POLICY "Own ekvation attempts or admin reads all" ON public.ekvation_attempts FOR SELECT TO authenticated
USING (
  (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved'))
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Own or admin read self assessments" ON public.self_assessment_responses;
CREATE POLICY "Own or admin read self assessments" ON public.self_assessment_responses FOR SELECT TO authenticated
USING (
  (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved'))
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Users read own results or admin reads all" ON public.tabelltest_results;
CREATE POLICY "Users read own results or admin reads all" ON public.tabelltest_results FOR SELECT TO authenticated
USING (
  (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved'))
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role)
);

-- Procent and Ekvationspusslet attempts are written only by the server after grading.
DROP POLICY IF EXISTS "Approved users insert own procent attempts" ON public.procent_attempts;
DROP POLICY IF EXISTS "Approved users insert own ekvation attempts" ON public.ekvation_attempts;
REVOKE INSERT, UPDATE, DELETE ON public.procent_attempts FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.ekvation_attempts FROM authenticated, anon;
GRANT ALL ON public.procent_attempts TO service_role;
GRANT ALL ON public.ekvation_attempts TO service_role;

-- Server-issued tasks (server-only; no client policies).
CREATE TABLE public.exercise_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game text NOT NULL CHECK (game IN ('procent', 'ekvation')),
  mode text NOT NULL,
  level smallint NOT NULL CHECK (level BETWEEN 0 AND 5),
  session_id uuid NOT NULL,
  task jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_marked_at timestamptz,
  answered_at timestamptz
);
GRANT ALL ON public.exercise_tasks TO service_role;
REVOKE ALL ON public.exercise_tasks FROM anon, authenticated;
ALTER TABLE public.exercise_tasks ENABLE ROW LEVEL SECURITY;
CREATE INDEX exercise_tasks_user_recent ON public.exercise_tasks (user_id, game, mode, created_at DESC);
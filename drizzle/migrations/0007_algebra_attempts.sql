CREATE TABLE public.algebra_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('simplify','evaluate','both')),
  level smallint NOT NULL CHECK (level BETWEEN 0 AND 6),
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX algebra_attempts_user_idx ON public.algebra_attempts(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.algebra_attempts TO authenticated;
GRANT ALL ON public.algebra_attempts TO service_role;
ALTER TABLE public.algebra_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved users insert own algebra attempts" ON public.algebra_attempts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved')));
CREATE POLICY "Own algebra attempts or admin reads all" ON public.algebra_attempts FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
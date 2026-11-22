CREATE TABLE public.geometrigymmet_progress (
  user_id uuid PRIMARY KEY,
  progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  mastered_count integer NOT NULL DEFAULT 0 CHECK (mastered_count >= 0 AND mastered_count <= 100),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.geometrigymmet_progress TO authenticated;
GRANT ALL ON public.geometrigymmet_progress TO service_role;
ALTER TABLE public.geometrigymmet_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own geometrigymmet progress or admin reads all" ON public.geometrigymmet_progress
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Approved users insert own geometrigymmet progress" ON public.geometrigymmet_progress
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND (public.has_role(auth.uid(), 'admin'::app_role) OR EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved')));
CREATE POLICY "Approved users update own geometrigymmet progress" ON public.geometrigymmet_progress
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND (public.has_role(auth.uid(), 'admin'::app_role) OR EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved')));
CREATE TABLE public.tabelltest_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null,
  total integer not null default 20,
  avg_time_ms integer not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);

CREATE INDEX tabelltest_results_user_idx ON public.tabelltest_results (user_id, created_at desc);

GRANT SELECT, INSERT ON public.tabelltest_results TO authenticated;
GRANT ALL ON public.tabelltest_results TO service_role;

ALTER TABLE public.tabelltest_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own results or admin reads all"
ON public.tabelltest_results FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role));

CREATE POLICY "Approved users insert own results"
ON public.tabelltest_results FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved')
));
CREATE TABLE public.class_presentations (
  grade integer PRIMARY KEY CHECK (grade BETWEEN 6 AND 9),
  url text NOT NULL CHECK (url ~ '^https://docs\.google\.com/presentation/'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_presentations TO authenticated;
GRANT ALL ON public.class_presentations TO service_role;
ALTER TABLE public.class_presentations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage class presentations" ON public.class_presentations FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
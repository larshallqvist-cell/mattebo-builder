CREATE TABLE public.exam_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade integer NOT NULL CHECK (grade BETWEEN 6 AND 9),
  sheet_id text NOT NULL CHECK (sheet_id ~ '^[A-Za-z0-9_-]{20,100}$'),
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grade, sheet_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_sheets TO authenticated;
GRANT ALL ON public.exam_sheets TO service_role;
ALTER TABLE public.exam_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage exam sheets" ON public.exam_sheets FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
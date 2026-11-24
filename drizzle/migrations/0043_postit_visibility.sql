CREATE TABLE public.postit_visibility (grade integer PRIMARY KEY, visible boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.postit_visibility TO authenticated;
GRANT ALL ON public.postit_visibility TO service_role;
ALTER TABLE public.postit_visibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in read" ON public.postit_visibility FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert" ON public.postit_visibility FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update" ON public.postit_visibility FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
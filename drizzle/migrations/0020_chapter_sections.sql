CREATE TABLE public.chapter_sections (
  grade integer NOT NULL,
  chapter integer NOT NULL,
  sections text[] NOT NULL DEFAULT '{}',
  current_index integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (grade, chapter)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapter_sections TO authenticated;
GRANT ALL ON public.chapter_sections TO service_role;
ALTER TABLE public.chapter_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved users can read chapter sections" ON public.chapter_sections FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved')
);
CREATE POLICY "Admins can insert chapter sections" ON public.chapter_sections FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role)
);
CREATE POLICY "Admins can update chapter sections" ON public.chapter_sections FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role)
);
CREATE POLICY "Admins can delete chapter sections" ON public.chapter_sections FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role)
);
CREATE TRIGGER chapter_sections_updated_at BEFORE UPDATE ON public.chapter_sections FOR EACH ROW EXECUTE FUNCTION public.update_lunch_menu_updated_at();
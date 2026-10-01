GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_notes TO authenticated;
GRANT ALL ON public.lesson_notes TO service_role;
DROP POLICY IF EXISTS "Admins manage lesson notes" ON public.lesson_notes;
CREATE POLICY "Admins manage lesson notes" ON public.lesson_notes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
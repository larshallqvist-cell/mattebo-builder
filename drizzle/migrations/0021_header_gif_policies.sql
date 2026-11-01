CREATE POLICY "Header gif public read" ON storage.objects FOR SELECT USING (bucket_id = 'header-gif');
CREATE POLICY "Admins upload header gif" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'header-gif' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update header gif" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'header-gif' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete header gif" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'header-gif' AND public.has_role(auth.uid(), 'admin'));
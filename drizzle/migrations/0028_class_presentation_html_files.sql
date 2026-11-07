CREATE POLICY "Admins read class presentation files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'class-presentations' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role));
CREATE POLICY "Admins upload class presentation files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'class-presentations' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role));
CREATE POLICY "Admins update class presentation files" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'class-presentations' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role));
CREATE POLICY "Admins delete class presentation files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'class-presentations' AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role));

ALTER TABLE public.class_presentations ADD COLUMN file_path text, ADD COLUMN file_name text;
ALTER TABLE public.class_presentations DROP CONSTRAINT class_presentations_url_check;
ALTER TABLE public.class_presentations ADD CONSTRAINT class_presentations_url_check
  CHECK (url = '' OR url ~ '^https://docs\.google\.com/presentation/');
ALTER TABLE public.class_presentations ADD CONSTRAINT class_presentations_file_path_check
  CHECK (file_path IS NULL OR file_path ~ '^ak[6-9]/[A-Za-z0-9._-]+\.html$');
ALTER TABLE public.class_presentations ADD CONSTRAINT class_presentations_has_target
  CHECK (url <> '' OR file_path IS NOT NULL);
COMMENT ON COLUMN public.class_presentations.url IS 'Google Slides link, or empty string when an uploaded HTML file (file_path) is used';
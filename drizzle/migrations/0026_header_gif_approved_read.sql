DROP POLICY IF EXISTS "Header gif public read" ON storage.objects;
CREATE POLICY "Approved users read header gif" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'header-gif' AND (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved')
  )
);
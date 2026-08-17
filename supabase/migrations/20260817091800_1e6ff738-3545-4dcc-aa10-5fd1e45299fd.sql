DROP POLICY IF EXISTS "Users can insert own request" ON public.access_requests;
CREATE POLICY "Users can insert own request"
ON public.access_requests
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'
  AND reviewed_at IS NULL
  AND reviewed_by IS NULL
);
ALTER TABLE public.braklabbet_progress ADD CONSTRAINT braklabbet_progress_known_mission CHECK (mission_id IN ('extend-by-two'));
DROP POLICY IF EXISTS "Users insert own mission progress" ON public.braklabbet_progress;
CREATE POLICY "Approved users insert own mission progress" ON public.braklabbet_progress
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id AND (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    OR EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved')
  )
);
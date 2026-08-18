REVOKE ALL ON public.calendar_cache FROM anon, authenticated;
GRANT SELECT ON public.calendar_cache TO authenticated;
GRANT ALL ON public.calendar_cache TO service_role;

DROP POLICY IF EXISTS "No client writes to calendar cache" ON public.calendar_cache;
CREATE POLICY "No client writes to calendar cache"
ON public.calendar_cache
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (false);
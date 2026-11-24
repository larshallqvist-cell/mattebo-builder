DROP POLICY IF EXISTS "Approved users insert own koordinat attempts" ON public.koordinat_attempts;
DROP POLICY IF EXISTS "Approved users insert own linje attempts" ON public.linje_attempts;
DROP POLICY IF EXISTS "Approved users insert own sannolikhet progress" ON public.sannolikhet_progress;
DROP POLICY IF EXISTS "Approved users update own sannolikhet progress" ON public.sannolikhet_progress;
REVOKE INSERT, UPDATE, DELETE ON public.koordinat_attempts, public.linje_attempts, public.sannolikhet_progress FROM authenticated, anon;
GRANT ALL ON public.koordinat_attempts, public.linje_attempts, public.sannolikhet_progress TO service_role;
ALTER TABLE public.ekvation_attempts DROP CONSTRAINT IF EXISTS ekvation_attempts_theme_check;
ALTER TABLE public.ekvation_attempts ADD CONSTRAINT ekvation_attempts_theme_check CHECK (theme IN ('djur','profiler','blandat'));
ALTER TABLE public.ekvation_attempts ALTER COLUMN theme SET DEFAULT 'blandat';
COMMENT ON COLUMN public.ekvation_attempts.theme IS 'DEPRECATED: the theme picker was removed; new rows get blandat (mixed figures). Old rows keep djur/profiler.';
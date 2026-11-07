ALTER TABLE public.procent_attempts DROP CONSTRAINT IF EXISTS procent_attempts_level_check;
ALTER TABLE public.procent_attempts ADD CONSTRAINT procent_attempts_level_check CHECK (level >= 0 AND level <= 9);
ALTER TABLE public.procent_attempts DROP CONSTRAINT IF EXISTS procent_attempts_mode_check;
ALTER TABLE public.procent_attempts ADD CONSTRAINT procent_attempts_mode_check CHECK (mode IN ('triangel', 'faktor', 'mangd'));
ALTER TABLE public.procent_attempts ADD COLUMN IF NOT EXISTS streak integer CHECK (streak IS NULL OR (streak >= 0 AND streak <= 100000));
COMMENT ON COLUMN public.procent_attempts.streak IS 'Mängdträning: antal rätt i rad efter detta svar (0 vid fel). NULL för äldre övningar.';
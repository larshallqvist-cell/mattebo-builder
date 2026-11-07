ALTER TABLE public.procent_attempts DROP CONSTRAINT IF EXISTS procent_attempts_mode_check;
ALTER TABLE public.procent_attempts ADD CONSTRAINT procent_attempts_mode_check CHECK (mode IN ('triangel', 'faktor', 'mangd', 'faktormangd'));
ALTER TABLE public.procent_attempts DROP CONSTRAINT IF EXISTS procent_attempts_task_kind_check;
ALTER TABLE public.procent_attempts ADD CONSTRAINT procent_attempts_task_kind_check CHECK (task_kind IN ('andel', 'delen', 'hela', 'okning', 'minskning', 'faktor', 'nytt', 'procent'));
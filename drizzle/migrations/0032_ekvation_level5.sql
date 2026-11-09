ALTER TABLE public.ekvation_attempts DROP CONSTRAINT ekvation_attempts_level_check;
ALTER TABLE public.ekvation_attempts ADD CONSTRAINT ekvation_attempts_level_check CHECK (level >= 0 AND level <= 4);
ALTER TABLE public.ekvation_attempts DROP CONSTRAINT ekvation_attempts_error_kind_check;
ALTER TABLE public.ekvation_attempts ADD CONSTRAINT ekvation_attempts_error_kind_check CHECK (error_kind IS NULL OR error_kind = ANY (ARRAY['priority'::text, 'parenthesis'::text, 'other'::text]));
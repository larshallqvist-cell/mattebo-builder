ALTER TABLE public.ekvation_attempts ADD COLUMN puzzle_id uuid;
ALTER TABLE public.ekvation_attempts ADD COLUMN error_kind text CHECK (error_kind IS NULL OR error_kind IN ('priority','other'));
ALTER TABLE public.ekvation_attempts ADD COLUMN seconds_spent integer CHECK (seconds_spent IS NULL OR seconds_spent BETWEEN 0 AND 300);
COMMENT ON COLUMN public.ekvation_attempts.seconds_spent IS 'Seconds since the puzzle appeared or the previous answer, capped at 300 so idle time is not counted.';
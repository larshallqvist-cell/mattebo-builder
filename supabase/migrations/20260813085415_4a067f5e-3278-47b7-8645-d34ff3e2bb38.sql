ALTER TABLE public.lesson_plans ADD COLUMN IF NOT EXISTS event_uid text;

UPDATE public.lesson_plans
SET event_uid = 'legacy:' || to_char(starts_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
WHERE event_uid IS NULL OR event_uid = '';

ALTER TABLE public.lesson_plans ALTER COLUMN event_uid SET NOT NULL;

DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.lesson_plans'::regclass AND contype IN ('u','p') AND conname <> 'lesson_plans_pkey'
  LOOP
    EXECUTE format('ALTER TABLE public.lesson_plans DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.lesson_plans
  ADD CONSTRAINT lesson_plans_grade_event_uid_key UNIQUE (grade, event_uid);
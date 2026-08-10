CREATE TABLE IF NOT EXISTS public.calendar_cache (
  grade INTEGER PRIMARY KEY,
  ics_data TEXT NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT ALL ON public.calendar_cache TO service_role;
ALTER TABLE public.calendar_cache ENABLE ROW LEVEL SECURITY;
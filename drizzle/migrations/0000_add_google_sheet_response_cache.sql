CREATE TABLE public.google_sheet_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.google_sheet_cache TO service_role;

ALTER TABLE public.google_sheet_cache ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.google_sheet_cache IS 'Server-only cache for quota-limited Google Sheets reads.';
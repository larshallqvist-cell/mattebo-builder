ALTER TABLE public.tabelltest_results
  ADD COLUMN input_mode text NOT NULL DEFAULT 'voice'
  CHECK (input_mode IN ('voice', 'keyboard'));
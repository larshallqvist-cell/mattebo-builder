
-- Create lunch_menu table
CREATE TABLE public.lunch_menu (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  menu_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast date lookups
CREATE INDEX idx_lunch_menu_date ON public.lunch_menu (date);

-- Enable RLS
ALTER TABLE public.lunch_menu ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Anyone can read lunch menu"
  ON public.lunch_menu FOR SELECT
  USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated users can insert lunch menu"
  ON public.lunch_menu FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update
CREATE POLICY "Authenticated users can update lunch menu"
  ON public.lunch_menu FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Authenticated users can delete
CREATE POLICY "Authenticated users can delete lunch menu"
  ON public.lunch_menu FOR DELETE
  USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_lunch_menu_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_lunch_menu_updated_at
  BEFORE UPDATE ON public.lunch_menu
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lunch_menu_updated_at();

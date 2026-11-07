CREATE TABLE public.section_presentations (
  grade integer NOT NULL CHECK (grade BETWEEN 6 AND 9),
  chapter integer NOT NULL CHECK (chapter BETWEEN 1 AND 9),
  section integer NOT NULL CHECK (section BETWEEN 1 AND 20),
  file_path text NOT NULL,
  file_name text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (grade, chapter, section)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.section_presentations TO authenticated;
GRANT ALL ON public.section_presentations TO service_role;

ALTER TABLE public.section_presentations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage section presentations"
ON public.section_presentations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TABLE public.game_visibility (
  grade integer NOT NULL CHECK (grade BETWEEN 6 AND 9),
  chapter integer NOT NULL CHECK (chapter BETWEEN 1 AND 5),
  game_key text NOT NULL CHECK (game_key ~ '^[a-z]{2,20}$'),
  enabled boolean NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (grade, chapter, game_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_visibility TO authenticated;
GRANT ALL ON public.game_visibility TO service_role;

ALTER TABLE public.game_visibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can read game visibility" ON public.game_visibility
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved'));

CREATE POLICY "Admins can insert game visibility" ON public.game_visibility
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update game visibility" ON public.game_visibility
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete game visibility" ON public.game_visibility
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TABLE public.self_assessment_questions (
  grade integer NOT NULL,
  chapter integer NOT NULL,
  section_index integer NOT NULL,
  questions text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (grade, chapter, section_index)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.self_assessment_questions TO authenticated;
GRANT ALL ON public.self_assessment_questions TO service_role;
ALTER TABLE public.self_assessment_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved read self assessment questions" ON public.self_assessment_questions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin') OR EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved'));
CREATE POLICY "Admins write self assessment questions" ON public.self_assessment_questions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TABLE public.self_assessment_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  grade integer NOT NULL,
  chapter integer NOT NULL,
  section_index integer NOT NULL,
  questions text[] NOT NULL,
  ratings smallint[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, grade, chapter, section_index),
  CHECK (array_length(ratings, 1) = array_length(questions, 1)),
  CHECK (0 <= ALL (ratings) AND 4 >= ALL (ratings))
);
GRANT SELECT, INSERT, UPDATE ON public.self_assessment_responses TO authenticated;
GRANT ALL ON public.self_assessment_responses TO service_role;
ALTER TABLE public.self_assessment_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or admin read self assessments" ON public.self_assessment_responses FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Approved insert own self assessments" ON public.self_assessment_responses FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin') OR EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved')));
CREATE POLICY "Own update self assessments" ON public.self_assessment_responses FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
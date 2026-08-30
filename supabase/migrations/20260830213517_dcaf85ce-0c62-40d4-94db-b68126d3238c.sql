CREATE TABLE public.weekly_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade integer NOT NULL,
  week_start date NOT NULL,
  is_open boolean NOT NULL DEFAULT true,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grade, week_start)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_surveys TO authenticated;
GRANT ALL ON public.weekly_surveys TO service_role;

ALTER TABLE public.weekly_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can read surveys"
ON public.weekly_surveys FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  OR EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved')
);

CREATE POLICY "Admins can insert surveys"
ON public.weekly_surveys FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "Admins can update surveys"
ON public.weekly_surveys FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "Admins can delete surveys"
ON public.weekly_surveys FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER weekly_surveys_updated_at
BEFORE UPDATE ON public.weekly_surveys
FOR EACH ROW EXECUTE FUNCTION public.update_lunch_menu_updated_at();

CREATE TABLE public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.weekly_surveys(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  q_learning smallint NOT NULL,
  q_effort smallint NOT NULL,
  q_calm smallint NOT NULL,
  q_teacher smallint NOT NULL,
  learned_text text NOT NULL DEFAULT '',
  wish_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (survey_id, user_id),
  CHECK (q_learning BETWEEN 1 AND 3),
  CHECK (q_effort BETWEEN 1 AND 3),
  CHECK (q_calm BETWEEN 1 AND 3),
  CHECK (q_teacher BETWEEN 1 AND 3)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.survey_responses TO authenticated;
GRANT ALL ON public.survey_responses TO service_role;

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own response"
ON public.survey_responses FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

CREATE POLICY "Approved users can insert own response"
ON public.survey_responses FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.weekly_surveys s
    WHERE s.id = survey_id AND s.is_open = true
  )
  AND (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    OR EXISTS (SELECT 1 FROM public.access_requests ar WHERE ar.user_id = auth.uid() AND ar.status = 'approved')
  )
);

CREATE POLICY "Users can update own response while open"
ON public.survey_responses FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.weekly_surveys s WHERE s.id = survey_id AND s.is_open = true)
)
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.weekly_surveys s WHERE s.id = survey_id AND s.is_open = true)
);

CREATE POLICY "Admins can delete responses"
ON public.survey_responses FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER survey_responses_updated_at
BEFORE UPDATE ON public.survey_responses
FOR EACH ROW EXECUTE FUNCTION public.update_lunch_menu_updated_at();

CREATE INDEX idx_survey_responses_survey ON public.survey_responses(survey_id);
CREATE INDEX idx_weekly_surveys_grade_week ON public.weekly_surveys(grade, week_start DESC);
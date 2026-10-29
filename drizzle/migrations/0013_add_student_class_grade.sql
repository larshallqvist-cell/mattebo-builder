-- Class (årskurs) per student. Auto-assigned from the student's first recorded activity, correctable by an admin.
ALTER TABLE public.profiles ADD COLUMN class_grade smallint;

-- Backfill 1: grade of the student's earliest recorded resource click.
UPDATE public.profiles p
SET class_grade = s.grade::smallint
FROM (
  SELECT DISTINCT ON (a.user_id) a.user_id, a.grade
  FROM public.activity_logs a
  JOIN public.access_requests ar ON ar.user_id = a.user_id AND ar.status = 'approved'
  WHERE a.grade BETWEEN 6 AND 9
  ORDER BY a.user_id, a.created_at ASC, a.id ASC
) s
WHERE s.user_id = p.id AND p.class_grade IS NULL;

-- Backfill 2: earliest visited grade page for students who never clicked a resource.
UPDATE public.profiles p
SET class_grade = v.grade
FROM (
  SELECT DISTINCT ON (sv.user_id) sv.user_id,
    CASE sv.path WHEN '/ak6' THEN 6::smallint WHEN '/ak7' THEN 7::smallint WHEN '/ak8' THEN 8::smallint WHEN '/ak9' THEN 9::smallint END AS grade
  FROM public.student_visits sv
  JOIN public.access_requests ar ON ar.user_id = sv.user_id AND ar.status = 'approved'
  WHERE sv.path IN ('/ak6', '/ak7', '/ak8', '/ak9')
  ORDER BY sv.user_id, sv.started_at ASC, sv.id ASC
) v
WHERE v.user_id = p.id AND p.class_grade IS NULL AND v.grade IS NOT NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_class_grade_range CHECK (class_grade IS NULL OR class_grade BETWEEN 6 AND 9);

-- Pick the grade a student was first seen in (resource clicks, then visited grade pages).
CREATE OR REPLACE FUNCTION public.first_recorded_grade(p_user_id uuid)
RETURNS smallint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT a.grade::smallint
       FROM public.activity_logs a
      WHERE a.user_id = p_user_id AND a.grade BETWEEN 6 AND 9
      ORDER BY a.created_at ASC, a.id ASC
      LIMIT 1),
    (SELECT CASE sv.path WHEN '/ak6' THEN 6::smallint WHEN '/ak7' THEN 7::smallint WHEN '/ak8' THEN 8::smallint WHEN '/ak9' THEN 9::smallint END
       FROM public.student_visits sv
      WHERE sv.user_id = p_user_id AND sv.path IN ('/ak6', '/ak7', '/ak8', '/ak9')
      ORDER BY sv.started_at ASC, sv.id ASC
      LIMIT 1)
  );
$$;

-- Only an admin may move a student to another class; the student's own profile edit cannot.
CREATE OR REPLACE FUNCTION public.guard_profile_class_grade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.class_grade IS DISTINCT FROM OLD.class_grade
     AND NOT public.has_role(auth.uid(), 'admin')
     AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Endast administratör kan ändra klass';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_guard_class_grade ON public.profiles;
CREATE TRIGGER profiles_guard_class_grade
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_class_grade();

-- When a student is let in, give them the class where they were first active.
CREATE OR REPLACE FUNCTION public.assign_class_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g smallint;
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM NEW.status THEN
    g := public.first_recorded_grade(NEW.user_id);
    IF g IS NOT NULL THEN
      UPDATE public.profiles SET class_grade = g
       WHERE id = NEW.user_id AND class_grade IS NULL;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS access_requests_assign_class ON public.access_requests;
CREATE TRIGGER access_requests_assign_class
  AFTER UPDATE OF status ON public.access_requests
  FOR EACH ROW EXECUTE FUNCTION public.assign_class_on_approval();

-- Admin button: fill in classes for already approved students that are still missing one.
CREATE OR REPLACE FUNCTION public.fill_missing_classes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  filled integer := 0;
  g smallint;
  r record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Endast administratör kan fylla i klasser';
  END IF;
  FOR r IN
    SELECT p.id
      FROM public.profiles p
      JOIN public.access_requests ar ON ar.user_id = p.id AND ar.status = 'approved'
     WHERE p.class_grade IS NULL
     ORDER BY p.created_at
  LOOP
    g := public.first_recorded_grade(r.id);
    IF g IS NOT NULL THEN
      UPDATE public.profiles SET class_grade = g WHERE id = r.id;
      filled := filled + 1;
    END IF;
  END LOOP;
  RETURN filled;
END $$;

-- Admins need write access to profiles to correct a class; students keep their own-row update.
CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Internal helpers are never callable from the app; the fill-in RPC is admin-checked inside.
REVOKE ALL ON FUNCTION public.first_recorded_grade(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assign_class_on_approval() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_profile_class_grade() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fill_missing_classes() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fill_missing_classes() TO authenticated;
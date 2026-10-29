-- 0 = "Inte elev" (e.g. a parent), set by the admin; kept out of class lists and auto-fill.
ALTER TABLE public.profiles DROP CONSTRAINT profiles_class_grade_range;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_class_grade_range CHECK (class_grade IS NULL OR class_grade = 0 OR class_grade BETWEEN 6 AND 9);
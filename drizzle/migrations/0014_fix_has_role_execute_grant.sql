-- RLS policies call public.has_role(), so PostgREST must be able to execute it.
-- It was revoked from authenticated when function EXECUTE rights were tightened, which
-- made every policy that calls it fail with "permission denied for function has_role".
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
-- Same for the student-visit recorder: the client calls this RPC directly.
GRANT EXECUTE ON FUNCTION public.record_student_visit(uuid, uuid, text, integer) TO authenticated;
-- record_braklabbet_attempt stays service_role-only (called from the edge function),
-- and first_recorded_grade / assign_class_on_approval / guard_profile_class_grade stay
-- internal to the SECURITY DEFINER functions that use them. No new access is opened.
/**
 * Elevvy: a teacher can preview the app exactly as a student sees it.
 *
 * The switch is stored per device so the preview survives a refresh, and it is
 * only ever honoured for an account that really is a teacher.
 */
export const STUDENT_VIEW_KEY = "mattebo_student_view";

/** Student view applies only to a real teacher, and only when it was switched on. */
export function studentViewEnabled(isTeacher: boolean, storedFlag: string | null): boolean {
  return isTeacher && storedFlag === "1";
}

/** While a teacher previews the student view, no teacher-only interface may show. */
export function effectiveIsAdmin(isTeacher: boolean, studentView: boolean): boolean {
  return isTeacher && !studentView;
}

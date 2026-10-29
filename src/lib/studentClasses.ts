/** Class (årskurs) membership per student. Set automatically from the student's first
 *  recorded activity and correctable by an admin; `null` means still unknown and
 *  `NOT_STUDENT` (0) marks someone who is not a student, e.g. a parent. */

export const CLASS_GRADES = [6, 7, 8, 9] as const;
export const NOT_STUDENT = 0;

export type RosterStudent = {
  user_id: string;
  full_name: string;
  last_sign_in_at: string | null;
  class_grade: number | null;
};

export type ClassGroup = { grade: number | null; label: string; students: RosterStudent[] };

export function isClassGrade(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 6 && value <= 9;
}

export function classLabel(grade: number | null): string {
  if (grade === NOT_STUDENT) return "Inte elev";
  return isClassGrade(grade) ? `Åk ${grade}` : "Okänd klass";
}

const byName = (a: RosterStudent, b: RosterStudent) => a.full_name.localeCompare(b.full_name, "sv");

/** Åk 6 → Åk 9 in order, then unknown class, then "Inte elev" (both only when needed). */
export function groupByClass(students: RosterStudent[]): ClassGroup[] {
  const groups: ClassGroup[] = CLASS_GRADES.map((grade) => ({
    grade,
    label: classLabel(grade),
    students: students.filter((s) => s.class_grade === grade).sort(byName),
  }));
  const unknown = students.filter((s) => !isClassGrade(s.class_grade) && s.class_grade !== NOT_STUDENT).sort(byName);
  if (unknown.length > 0) groups.push({ grade: null, label: "Okänd klass", students: unknown });
  const others = students.filter((s) => s.class_grade === NOT_STUDENT).sort(byName);
  if (others.length > 0) groups.push({ grade: NOT_STUDENT, label: "Inte elev", students: others });
  return groups;
}

export function missingClassCount(students: RosterStudent[]): number {
  return students.filter((s) => !isClassGrade(s.class_grade) && s.class_grade !== NOT_STUDENT).length;
}

import { isGameOpenForGrade, type VisibilityRow } from "./gameVisibility";

/** Samma regel som Kistan: spelmatrisen styr elever; lärare, vårdnadshavare och elever utan klass släpps in. */
export function sannolikhetAvailable(grade: number | null | undefined, isAdmin = false, rows: readonly VisibilityRow[] = []): boolean {
  if (isAdmin) return true;
  if (grade === null || grade === undefined || grade < 6 || grade > 9) return true;
  return isGameOpenForGrade(rows, "sannolikhet", grade);
}

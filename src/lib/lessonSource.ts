/**
 * Google Kalender bestämmer över lektionstexten.
 *
 * Mattebos sparade kopia används bara när den är nyare än kalenderns senaste
 * ändring – alltså under de minuter då kalenderflödet ännu inte hunnit visa en
 * text som just sparats i Admin. Ändras händelsen i kalendern efteråt vinner
 * kalendern, även om texten där är tom.
 */
export interface LessonFieldSources {
  calendarValue?: string | null;
  /** Kalenderhändelsens LAST-MODIFIED. */
  calendarModified?: Date | null;
  planValue?: string | null;
  /** lesson_plans.updated_at (ISO). */
  planUpdated?: string | null;
}

export function planIsNewer(calendarModified?: Date | null, planUpdated?: string | null): boolean {
  if (!planUpdated) return false;
  const planMs = Date.parse(planUpdated);
  if (Number.isNaN(planMs)) return false;
  if (!calendarModified || Number.isNaN(calendarModified.getTime())) return false;
  return planMs > calendarModified.getTime();
}

export function pickLessonField({ calendarValue, calendarModified, planValue, planUpdated }: LessonFieldSources): string {
  const cal = calendarValue ?? "";
  const plan = planValue ?? "";
  if (!plan.trim()) return cal;
  // Utan ändringsdatum i kalendern: kalenderns text gäller om den finns.
  if (!calendarModified) return cal.trim() ? cal : plan;
  return planIsNewer(calendarModified, planUpdated) ? plan : cal;
}

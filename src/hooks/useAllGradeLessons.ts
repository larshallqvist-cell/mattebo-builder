import { useMemo } from "react";
import { useCalendarEvents, type CalendarEvent } from "@/hooks/useCalendarEvents";
import { useLessonPlans } from "@/hooks/useLessonPlans";

export interface GradeLessonData {
  grade: number;
  events: CalendarEvent[];
  plans: Record<string, string>;
  titles: Record<string, string>;
  savePlan: ReturnType<typeof useLessonPlans>["savePlan"];
}

/**
 * Loads calendars + saved plans for every supported grade at once.
 * Hooks are called in a fixed order (6, 7, 8, 9) so the rules of hooks hold.
 */
export const useAllGradeLessons = () => {
  const c6 = useCalendarEvents(6);
  const c7 = useCalendarEvents(7);
  const c8 = useCalendarEvents(8);
  const c9 = useCalendarEvents(9);

  const p6 = useLessonPlans(6);
  const p7 = useLessonPlans(7);
  const p8 = useLessonPlans(8);
  const p9 = useLessonPlans(9);

  const byGrade = useMemo<Record<number, GradeLessonData>>(
    () => ({
      6: { grade: 6, events: c6.events, plans: p6.plans, titles: p6.titles, savePlan: p6.savePlan },
      7: { grade: 7, events: c7.events, plans: p7.plans, titles: p7.titles, savePlan: p7.savePlan },
      8: { grade: 8, events: c8.events, plans: p8.plans, titles: p8.titles, savePlan: p8.savePlan },
      9: { grade: 9, events: c9.events, plans: p9.plans, titles: p9.titles, savePlan: p9.savePlan },
    }),
    [
      c6.events, c7.events, c8.events, c9.events,
      p6.plans, p7.plans, p8.plans, p9.plans,
      p6.titles, p7.titles, p8.titles, p9.titles,
      p6.savePlan, p7.savePlan, p8.savePlan, p9.savePlan,
    ],
  );

  const loading = c6.loading || c7.loading || c8.loading || c9.loading;

  return { byGrade, loading };
};

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PlanTarget {
  uid: string;
  date: Date;
}

/** Plans are keyed by the calendar event's stable UID, so they survive schedule changes. */
export const lessonPlanKey = (event: PlanTarget) => event.uid;

/** Rows created before UID-keying were keyed by start time. */
export const legacyLessonPlanKey = (date: Date) => `legacy:${date.toISOString().replace(/\.\d{3}Z$/, "Z")}`;

export const getLessonPlan = (plans: Record<string, string>, event: PlanTarget) =>
  plans[lessonPlanKey(event)] ?? plans[legacyLessonPlanKey(event.date)];

export const getLessonTitle = (titles: Record<string, string>, event: PlanTarget) =>
  (titles[lessonPlanKey(event)] ?? "").trim() || undefined;

export const useLessonPlans = (grade: number) => {
  const [plans, setPlans] = useState<Record<string, string>>({});
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("lesson_plans")
      .select("event_uid, starts_at, content, title")
      .eq("grade", grade)
      // Cache-buster: iOS Safari happily serves stale GET responses otherwise.
      .neq("id", crypto.randomUUID());

    if (!error && data) {
      const map: Record<string, string> = {};
      const titleMap: Record<string, string> = {};
      data.forEach((row) => {
        map[row.event_uid as string] = (row.content as string) ?? "";
        titleMap[row.event_uid as string] = ((row as { title?: string }).title as string) ?? "";
      });
      setPlans(map);
      setTitles(titleMap);
    }
    setLoading(false);
  }, [grade]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep plans fresh: refetch when the tab regains focus and when rows change
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    // Fallback for iOS/PWA where realtime websockets can be dropped in the background.
    const poll = window.setInterval(onFocus, 60_000);

    const channel = supabase
      .channel(`lesson_plans_${grade}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lesson_plans", filter: `grade=eq.${grade}` },
        () => load(),
      )
      .subscribe();

    return () => {
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      supabase.removeChannel(channel);
    };
  }, [grade, load]);

  const savePlan = useCallback(
    async (event: PlanTarget, content: string, title = "") => {
      const { error } = await supabase
        .from("lesson_plans")
        .upsert(
          { grade, event_uid: event.uid, starts_at: event.date.toISOString(), content, title },
          { onConflict: "grade,event_uid" },
        );
      if (error) throw error;
      setPlans((prev) => ({ ...prev, [lessonPlanKey(event)]: content }));
      setTitles((prev) => ({ ...prev, [lessonPlanKey(event)]: title }));
    },
    [grade],
  );

  return { plans, titles, loading, savePlan, reload: load };
};

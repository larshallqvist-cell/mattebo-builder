import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Lesson plans are keyed by the lesson's exact start time (ISO string). */
export const lessonPlanKey = (date: Date) => date.toISOString();

export const useLessonPlans = (grade: number) => {
  const [plans, setPlans] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("lesson_plans")
      .select("starts_at, content")
      .eq("grade", grade);

    if (!error && data) {
      const map: Record<string, string> = {};
      data.forEach((row) => {
        map[new Date(row.starts_at as string).toISOString()] = (row.content as string) ?? "";
      });
      setPlans(map);
    }
    setLoading(false);
  }, [grade]);

  useEffect(() => {
    load();
  }, [load]);

  const savePlan = useCallback(
    async (startsAt: Date, content: string) => {
      const { error } = await supabase
        .from("lesson_plans")
        .upsert(
          { grade, starts_at: startsAt.toISOString(), content },
          { onConflict: "grade,starts_at" },
        );
      if (error) throw error;
      setPlans((prev) => ({ ...prev, [lessonPlanKey(startsAt)]: content }));
    },
    [grade],
  );

  return { plans, loading, savePlan, reload: load };
};

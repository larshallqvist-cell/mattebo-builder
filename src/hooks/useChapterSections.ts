import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { clampCurrent } from "@/lib/chapterSections";

/** Sub-chapters for one grade + chapter, with the teacher's current one. */
export const useChapterSections = (grade: number, chapter: number) => {
  const [sections, setSections] = useState<string[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  // Teacher switch: makes "Hur går det?" pulse softly for the class.
  const [pulse, setPulseState] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("chapter_sections")
      .select("sections, current_index, assessment_pulse")
      .eq("grade", grade)
      .eq("chapter", chapter)
      .maybeSingle();
    const list = data?.sections ?? [];
    setSections(list);
    setCurrent(clampCurrent(data?.current_index, list.length));
    setPulseState(!!data?.assessment_pulse);
  }, [grade, chapter]);

  useEffect(() => {
    setSections([]);
    setCurrent(null);
    setPulseState(false);
    load();
    // Keep every copy on the page (header title and chips) in step after a save.
    const refresh = () => load();
    window.addEventListener("mattebo:chapter-sections-saved", refresh);
    return () => window.removeEventListener("mattebo:chapter-sections-saved", refresh);
  }, [load]);

  const save = useCallback(
    async (nextSections: string[], nextCurrent: number | null) => {
      const { error } = await supabase
        .from("chapter_sections")
        .upsert(
          { grade, chapter, sections: nextSections, current_index: clampCurrent(nextCurrent, nextSections.length) },
          { onConflict: "grade,chapter" },
        );
      if (error) throw error;
      window.dispatchEvent(new Event("mattebo:chapter-sections-saved"));
    },
    [grade, chapter, load],
  );

  const setPulse = useCallback(
    async (on: boolean) => {
      const { error } = await supabase
        .from("chapter_sections")
        .update({ assessment_pulse: on })
        .eq("grade", grade)
        .eq("chapter", chapter);
      if (error) throw error;
      window.dispatchEvent(new Event("mattebo:chapter-sections-saved"));
    },
    [grade, chapter],
  );

  return { sections, current, pulse, save, setPulse };
};

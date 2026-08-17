import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const DEFAULT_HOMEWORK_TITLE = "Läxa till måndag";

/** Homework note shown at the top of a grade page. One row per grade. */
export const useHomework = (grade: number) => {
  const [title, setTitle] = useState(DEFAULT_HOMEWORK_TITLE);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("homework")
      .select("title, content")
      .eq("grade", grade)
      .maybeSingle();
    setTitle(data?.title?.trim() || DEFAULT_HOMEWORK_TITLE);
    setContent(data?.content ?? "");
    setLoading(false);
  }, [grade]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    const poll = window.setInterval(onFocus, 60_000);

    const channel = supabase
      .channel(`homework_${grade}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "homework", filter: `grade=eq.${grade}` },
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

  const saveHomework = useCallback(
    async (nextTitle: string, nextContent: string) => {
      const { error } = await supabase
        .from("homework")
        .upsert(
          { grade, title: nextTitle.trim() || DEFAULT_HOMEWORK_TITLE, content: nextContent },
          { onConflict: "grade" },
        );
      if (error) throw error;
      setTitle(nextTitle.trim() || DEFAULT_HOMEWORK_TITLE);
      setContent(nextContent);
    },
    [grade],
  );

  return { title, content, loading, saveHomework, reload: load };
};

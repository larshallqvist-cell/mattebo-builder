import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NoteTarget {
  uid: string;
  date: Date;
}

/** Admin-only private notes for a single lesson, autosaved with debounce. */
export const useLessonNote = (grade: number, target: NoteTarget | null) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<number | null>(null);
  const pending = useRef<string | null>(null);
  const uid = target?.uid;
  const startsAt = target?.date.toISOString();

  useEffect(() => {
    setContent("");
    setStatus("idle");
    if (!uid) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from("lesson_notes")
      .select("content")
      .eq("grade", grade)
      .eq("event_uid", uid)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setContent(data?.content ?? "");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [grade, uid]);

  const flush = useCallback(async () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    const value = pending.current;
    if (value === null || !uid || !startsAt) return;
    pending.current = null;
    setStatus("saving");
    const { error } = await supabase
      .from("lesson_notes")
      .upsert({ grade, event_uid: uid, starts_at: startsAt, content: value }, { onConflict: "grade,event_uid" });
    setStatus(error ? "error" : "saved");
  }, [grade, uid, startsAt]);

  const update = useCallback(
    (value: string) => {
      setContent(value);
      pending.current = value;
      setStatus("saving");
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, 800);
    },
    [flush],
  );

  // Save any pending text when switching lesson or unmounting.
  useEffect(() => () => void flush(), [flush]);

  return { content, update, loading, status };
};

/** Most recent non-empty note in the grade before the given time. */
export const usePreviousLessonNote = (grade: number, before: Date | null) => {
  const [note, setNote] = useState<{ content: string; startsAt: Date } | null>(null);
  const iso = before?.toISOString();
  useEffect(() => {
    setNote(null);
    if (!iso) return;
    let cancelled = false;
    supabase
      .from("lesson_notes")
      .select("content, starts_at")
      .eq("grade", grade)
      .lt("starts_at", iso)
      .neq("content", "")
      .order("starts_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (!cancelled && data?.[0]) setNote({ content: data[0].content, startsAt: new Date(data[0].starts_at) });
      });
    return () => {
      cancelled = true;
    };
  }, [grade, iso]);
  return note;
};

export const noteStatusLabel = (s: string) =>
  s === "saving" ? "Sparar…" : s === "saved" ? "Sparat" : s === "error" ? "Kunde inte spara" : "";

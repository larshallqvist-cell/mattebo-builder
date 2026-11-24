import { supabase } from "@/integrations/supabase/client";

/** A task handed out and later graded by the server. id is null when the server could not be reached (answers are then not saved). */
export type Issued<T> = { id: string | null; task: T };

type Body = Record<string, unknown>;
async function call<R>(body: Body): Promise<R | null> {
  const { data, error } = await supabase.functions.invoke("exercise-task", { body });
  if (error || !data || (data as { error?: unknown }).error) {
    console.warn("exercise-task failed", error?.message ?? (data as { error?: unknown })?.error);
    return null;
  }
  return data as R;
}

/** Asks the server for a task; falls back to a local, unsaved task if the server is unreachable. */
export async function issueTask<T>(body: Body, fallback: () => T): Promise<Issued<T>> {
  const r = await call<{ id: string; task: T }>({ ...body, action: "issue" });
  return r ? { id: r.id, task: r.task } : { id: null, task: fallback() };
}

/** Sends the answer for server grading and saving. Returns the server's verdict, or null if not saved. */
export function answerTask<R = { correct: boolean; streak?: number }>(game: "procent" | "ekvation" | "koordinat" | "linje" | "sannolikhet", id: string | null, answer: unknown, hintUsed: boolean) {
  if (!id) return Promise.resolve(null);
  return call<R>({ game, action: "answer", id, answer, hintUsed });
}

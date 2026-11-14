// Hands out Procent and Ekvationspusslet tasks and grades answers on the server,
// so saved results always come from a server-checked answer to a server-issued task.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireApprovedUser } from "../_shared/auth.ts";
import {
  checkFactorDrill, checkTriangle, DRILL_TIERS, generateDrill, generateFactorDrill, parseNumber,
  type FactorFocus, type FactorTask, type Focus, type TriangleTask,
} from "../_shared/exercises/procent.ts";
import { checkAnswer, generatePuzzle, LEVELS, type Puzzle } from "../_shared/exercises/ekvationer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TASK_TTL_MS = 2 * 60 * 60 * 1000; // a task must be answered within 2 hours
const STREAK_WINDOW_MS = 2 * 60 * 60 * 1000; // a streak continues from answers in the last 2 hours
const FOCUS: Record<string, readonly string[]> = {
  mangd: ["mix", "delen", "andel", "hela"],
  faktormangd: ["mix", "faktor", "nytt", "procent"],
};
const isInt = (v: unknown, lo: number, hi: number): v is number => Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi;
const str = (v: unknown, max: number): v is string => typeof v === "string" && v.length > 0 && v.length <= max;

type TaskRow = { id: string; user_id: string; game: string; mode: string; level: number; session_id: string; task: unknown; created_at: string; last_marked_at: string | null; answered_at: string | null };

async function loadTask(userId: string, id: unknown, game: string): Promise<TaskRow | null> {
  if (typeof id !== "string" || !UUID.test(id)) return null;
  const { data } = await admin.from("exercise_tasks").select("*").eq("id", id).eq("user_id", userId).eq("game", game).maybeSingle();
  if (!data || data.answered_at) return null;
  if (Date.now() - new Date(data.created_at).getTime() > TASK_TTL_MS) return null;
  return data as TaskRow;
}

async function issue(userId: string, game: string, mode: string, level: number, sessionId: string, task: unknown) {
  // Old, unused tasks are cleaned up as new ones are handed out.
  await admin.from("exercise_tasks").delete().eq("user_id", userId).lt("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString());
  const { data, error } = await admin.from("exercise_tasks")
    .insert({ user_id: userId, game, mode, level, session_id: sessionId, task }).select("id").single();
  if (error || !data) { console.error("issue failed", error?.message); return json({ error: "Could not create task" }, 500); }
  return json({ id: data.id, task });
}

async function procent(userId: string, b: Record<string, unknown>) {
  if (b.action === "issue") {
    const mode = b.mode;
    if (mode !== "mangd" && mode !== "faktormangd") return json({ error: "Invalid mode" }, 400);
    if (typeof b.focus !== "string" || !FOCUS[mode].includes(b.focus)) return json({ error: "Invalid focus" }, 400);
    if (!isInt(b.tier, 0, DRILL_TIERS - 1)) return json({ error: "Invalid tier" }, 400);
    if (typeof b.sessionId !== "string" || !UUID.test(b.sessionId)) return json({ error: "Invalid session" }, 400);
    const { data: last } = await admin.from("exercise_tasks").select("task").eq("user_id", userId).eq("game", "procent").eq("mode", mode)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    const prev = (last?.task ?? undefined) as never;
    const task = mode === "mangd"
      ? generateDrill(b.focus as Focus, b.tier, Math.random, prev as TriangleTask | undefined)
      : generateFactorDrill(b.focus as FactorFocus, b.tier, Math.random, prev as FactorTask | undefined);
    return issue(userId, "procent", mode, b.tier, b.sessionId, task);
  }
  if (b.action === "answer") {
    if (!str(b.answer, 40) || parseNumber(b.answer) === null) return json({ error: "Invalid answer" }, 400);
    const row = await loadTask(userId, b.id, "procent");
    if (!row) return json({ error: "Task not found" }, 404);
    const task = row.task as TriangleTask & FactorTask;
    const correct = (row.mode === "mangd" ? checkTriangle(task, b.answer) : checkFactorDrill(task, b.answer)).correct;
    // Claim the task once, so the same answer can never be saved twice.
    const { data: claimed } = await admin.from("exercise_tasks").update({ answered_at: new Date().toISOString() })
      .eq("id", row.id).is("answered_at", null).select("id");
    if (!claimed?.length) return json({ error: "Task already answered" }, 409);
    const { data: prev } = await admin.from("procent_attempts").select("streak,created_at").eq("user_id", userId).eq("mode", row.mode)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    const prevStreak = prev && Date.now() - new Date(prev.created_at).getTime() < STREAK_WINDOW_MS ? (prev.streak ?? 0) : 0;
    const streak = correct ? prevStreak + 1 : 0;
    const { error } = await admin.from("procent_attempts").insert({
      user_id: userId, session_id: row.session_id, mode: row.mode, level: row.level, task_kind: task.kind,
      hint_used: b.hintUsed === true, is_correct: correct, streak,
    });
    if (error) { console.error("procent insert failed", error.message); return json({ error: "Could not save answer" }, 500); }
    return json({ correct, streak });
  }
  return json({ error: "Invalid action" }, 400);
}

async function ekvation(userId: string, b: Record<string, unknown>) {
  if (b.action === "issue") {
    if (!isInt(b.level, 0, LEVELS.length - 1)) return json({ error: "Invalid level" }, 400);
    if (typeof b.sessionId !== "string" || !UUID.test(b.sessionId)) return json({ error: "Invalid session" }, 400);
    return issue(userId, "ekvation", "puzzle", b.level, b.sessionId, generatePuzzle(b.level));
  }
  if (b.action === "answer") {
    if (!str(b.answer, 40)) return json({ error: "Invalid answer" }, 400);
    const row = await loadTask(userId, b.id, "ekvation");
    if (!row) return json({ error: "Task not found" }, 404);
    const r = checkAnswer(row.task as Puzzle, b.answer);
    if (!/\d/.test(b.answer)) return json({ correct: false, recorded: false }); // format only – not counted
    const now = Date.now();
    const since = new Date(row.last_marked_at ?? row.created_at).getTime();
    const seconds = Math.min(300, Math.max(0, Math.round((now - since) / 1000)));
    const stamp = new Date(now).toISOString();
    let claim = admin.from("exercise_tasks").update(r.correct ? { last_marked_at: stamp, answered_at: stamp } : { last_marked_at: stamp })
      .eq("id", row.id).is("answered_at", null);
    if (row.last_marked_at) claim = claim.eq("last_marked_at", row.last_marked_at); else claim = claim.is("last_marked_at", null);
    const { data: claimed } = await claim.select("id");
    if (!claimed?.length) return json({ error: "Task changed, try again" }, 409);
    const { error } = await admin.from("ekvation_attempts").insert({
      user_id: userId, session_id: row.session_id, level: row.level, hint_used: b.hintUsed === true, is_correct: r.correct,
      puzzle_id: row.id, error_kind: r.correct ? null : r.priorityError ? "priority" : r.parenError ? "parenthesis" : "other",
      seconds_spent: seconds,
    });
    if (error) { console.error("ekvation insert failed", error.message); return json({ error: "Could not save answer" }, 500); }
    return json({ correct: r.correct, recorded: true });
  }
  return json({ error: "Invalid action" }, 400);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const auth = await requireApprovedUser(req, corsHeaders);
    if (auth.error || !auth.userId) return auth.error ?? json({ error: "Unauthorized" }, 401);
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Invalid body" }, 400);
    const b = body as Record<string, unknown>;
    if (b.game === "procent") return await procent(auth.userId, b);
    if (b.game === "ekvation") return await ekvation(auth.userId, b);
    return json({ error: "Invalid game" }, 400);
  } catch (e) {
    console.error("exercise-task error", e instanceof Error ? e.message : e);
    return json({ error: "Internal error" }, 500);
  }
});

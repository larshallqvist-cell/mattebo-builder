// Hands out Procent, Ekvationspusslet, Koordinater, Räta linjen and Sannolikhetslabbet tasks and grades answers on the server,
// so saved results always come from a server-checked answer to a server-issued task.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireApprovedUser } from "../_shared/auth.ts";
import {
  checkFactorDrill, checkTriangle, DRILL_TIERS, generateDrill, generateFactorDrill, parseNumber,
  type FactorFocus, type FactorTask, type Focus, type TriangleTask,
} from "../_shared/exercises/procent.ts";
import { checkAnswer, generatePuzzle, LEVELS, type Puzzle } from "../_shared/exercises/ekvationer.ts";
import * as koord from "../_shared/exercises/koordinater.ts";
import * as linje from "../_shared/exercises/linjen.ts";
import * as sl from "../_shared/exercises/sannolikhet.ts";
import * as brakLib from "../_shared/exercises/brak.ts";
import * as alg from "../_shared/exercises/algebra.ts";
import * as kist from "../_shared/exercises/kistan.ts";
import * as gg from "../_shared/exercises/geometrigymmet.ts";

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

const num = (v: unknown, lim = 1000): v is number => typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= lim;
const pt = (v: unknown): v is { x: number; y: number } =>
  !!v && typeof v === "object" && num((v as { x: unknown }).x, 50) && num((v as { y: unknown }).y, 50);

/** Streak from the latest saved answer in the same mode, so clients never choose their own streak. */
async function nextStreak(table: string, userId: string, mode: string, correct: boolean) {
  const { data: prev } = await admin.from(table).select("streak,created_at").eq("user_id", userId).eq("mode", mode)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  const prevStreak = prev && Date.now() - new Date(prev.created_at).getTime() < STREAK_WINDOW_MS ? (prev.streak ?? 0) : 0;
  return correct ? prevStreak + 1 : 0;
}
async function claim(id: string) {
  const { data } = await admin.from("exercise_tasks").update({ answered_at: new Date().toISOString() }).eq("id", id).is("answered_at", null).select("id");
  return !!data?.length;
}

async function koordinat(userId: string, b: Record<string, unknown>) {
  if (b.action === "issue") {
    if (b.mode !== "las" && b.mode !== "mix") return json({ error: "Invalid mode" }, 400);
    if (!isInt(b.tier, 0, koord.KOORD_TIERS.length - 1)) return json({ error: "Invalid tier" }, 400);
    if (typeof b.sessionId !== "string" || !UUID.test(b.sessionId)) return json({ error: "Invalid session" }, 400);
    return issue(userId, "koordinat", b.mode, b.tier, b.sessionId, koord.generateTask(b.mode, b.tier));
  }
  if (b.action === "answer") {
    if (!pt(b.answer)) return json({ error: "Invalid answer" }, 400);
    const row = await loadTask(userId, b.id, "koordinat");
    if (!row) return json({ error: "Task not found" }, 404);
    const task = row.task as koord.KoordTask;
    const r = koord.checkAnswer(task, b.answer);
    if (!(await claim(row.id))) return json({ error: "Task already answered" }, 409);
    const streak = await nextStreak("koordinat_attempts", userId, row.mode, r.correct);
    const { error } = await admin.from("koordinat_attempts").insert({
      user_id: userId, session_id: row.session_id, mode: row.mode, level: row.level, task_kind: task.kind,
      hint_used: b.hintUsed === true, is_correct: r.correct, error_kind: r.error, streak,
    });
    if (error) { console.error("koordinat insert failed", error.message); return json({ error: "Could not save answer" }, 500); }
    return json({ correct: r.correct, streak });
  }
  return json({ error: "Invalid action" }, 400);
}

const LINJE_MODES = ["m", "k", "ekv", "rita", "parallell"];
function linjeAnswer(v: unknown): linje.LinjeAnswer | null {
  if (!v || typeof v !== "object") return null;
  const a = v as Record<string, unknown>; const out: linje.LinjeAnswer = {};
  if (a.k !== undefined) { if (!num(a.k)) return null; out.k = a.k; }
  if (a.m !== undefined) { if (!num(a.m)) return null; out.m = a.m; }
  if (a.points !== undefined) { if (!Array.isArray(a.points) || a.points.length > 2 || !a.points.every(pt)) return null; out.points = a.points; }
  if (a.pick !== undefined) { if (!Array.isArray(a.pick) || a.pick.length > 2 || !a.pick.every((i) => isInt(i, 0, 9))) return null; out.pick = a.pick as number[]; }
  return out;
}
async function linjen(userId: string, b: Record<string, unknown>) {
  if (b.action === "issue") {
    if (typeof b.mode !== "string" || !LINJE_MODES.includes(b.mode)) return json({ error: "Invalid mode" }, 400);
    if (!isInt(b.tier, 0, linje.LINJE_TIERS.length - 1)) return json({ error: "Invalid tier" }, 400);
    if (typeof b.sessionId !== "string" || !UUID.test(b.sessionId)) return json({ error: "Invalid session" }, 400);
    return issue(userId, "linje", b.mode, b.tier, b.sessionId, linje.generateTask(b.mode as linje.LinjeMode, b.tier));
  }
  if (b.action === "answer") {
    const ans = linjeAnswer(b.answer);
    if (!ans) return json({ error: "Invalid answer" }, 400);
    const row = await loadTask(userId, b.id, "linje");
    if (!row) return json({ error: "Task not found" }, 404);
    const r = linje.checkAnswer(row.task as linje.LinjeTask, ans);
    if (!(await claim(row.id))) return json({ error: "Task already answered" }, 409);
    const streak = await nextStreak("linje_attempts", userId, row.mode, r.correct);
    const { error } = await admin.from("linje_attempts").insert({
      user_id: userId, session_id: row.session_id, mode: row.mode, level: row.level,
      hint_used: b.hintUsed === true, is_correct: r.correct, error_kind: r.error, streak,
    });
    if (error) { console.error("linje insert failed", error.message); return json({ error: "Could not save answer" }, 500); }
    return json({ correct: r.correct, streak });
  }
  return json({ error: "Invalid action" }, 400);
}

type SlRound = { levelId: string; tasks: sl.Task[]; results: boolean[] };
async function sannolikhet(userId: string, b: Record<string, unknown>) {
  if (b.action === "issue") {
    const idx = sl.LEVELS.findIndex((l) => l.id === b.levelId);
    if (idx < 0) return json({ error: "Invalid level" }, 400);
    if (typeof b.sessionId !== "string" || !UUID.test(b.sessionId)) return json({ error: "Invalid session" }, 400);
    const level = sl.LEVELS[idx];
    const [{ data: rows }, { data: role }] = await Promise.all([
      admin.from("sannolikhet_progress").select("level_id,stars,best_correct").eq("user_id", userId),
      admin.from("user_roles").select("id").eq("user_id", userId).eq("role", "admin").maybeSingle(),
    ]);
    const progress: sl.ProgressMap = Object.fromEntries((rows ?? []).map((r) => [r.level_id, { stars: r.stars, best_correct: r.best_correct }]));
    if (!sl.isUnlocked(level.id, progress, !!role)) return json({ error: "Level locked" }, 403);
    const tasks = sl.makeRound(level);
    const res = await issue(userId, "sannolikhet", level.id, idx, b.sessionId, { levelId: level.id, tasks, results: [] } satisfies SlRound);
    if (res.status !== 200) return res;
    const { id } = await res.json();
    return json({ id, task: tasks });
  }
  if (b.action === "answer") {
    const a = b.answer as Record<string, unknown> | null;
    if (!a || typeof a !== "object" || !isInt(a.index, 0, 20)) return json({ error: "Invalid answer" }, 400);
    const input: sl.Input = {};
    for (const k of ["n", "d", "v"] as const) {
      if (a[k] === undefined) continue;
      if (typeof a[k] !== "string" || (a[k] as string).length > 20) return json({ error: "Invalid answer" }, 400);
      input[k] = a[k] as string;
    }
    const row = await loadTask(userId, b.id, "sannolikhet");
    if (!row) return json({ error: "Task not found" }, 404);
    const round = row.task as SlRound;
    if (a.index !== round.results.length) return json({ error: "Wrong task order" }, 409);
    const r = sl.checkAnswer(round.tasks[a.index], input);
    if (!r) return json({ error: "Invalid answer" }, 400);
    const results = [...round.results, r.ok];
    const done = results.length >= round.tasks.length;
    const stamp = new Date().toISOString();
    let upd = admin.from("exercise_tasks").update({ task: { ...round, results }, last_marked_at: stamp, ...(done ? { answered_at: stamp } : {}) })
      .eq("id", row.id).is("answered_at", null);
    upd = row.last_marked_at ? upd.eq("last_marked_at", row.last_marked_at) : upd.is("last_marked_at", null);
    const { data: claimed } = await upd.select("id");
    if (!claimed?.length) return json({ error: "Task changed, try again" }, 409);
    if (!done) return json({ ok: r.ok });
    const correct = results.filter(Boolean).length;
    const stars = sl.starsFor(correct);
    const { data: prev } = await admin.from("sannolikhet_progress").select("stars,best_correct").eq("user_id", userId).eq("level_id", round.levelId).maybeSingle();
    const best = sl.mergeBest(prev ?? undefined, stars, correct);
    if (best) {
      const { error } = await admin.from("sannolikhet_progress").upsert(
        { user_id: userId, level_id: round.levelId, ...best, updated_at: stamp }, { onConflict: "user_id,level_id" });
      if (error) { console.error("sannolikhet save failed", error.message); return json({ error: "Could not save result" }, 500); }
    }
    return json({ ok: r.ok, done: true, stars, correct });
  }
  return json({ error: "Invalid action" }, 400);
}

const isAdminUser = async (userId: string) =>
  !!(await admin.from("user_roles").select("id").eq("user_id", userId).eq("role", "admin").maybeSingle()).data;
const isSession = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

async function brak(userId: string, b: Record<string, unknown>) {
  if (b.action === "issue") {
    if (typeof b.focus !== "string" || ![...brakLib.BANOR, "mix"].includes(b.focus)) return json({ error: "Invalid focus" }, 400);
    if (!isInt(b.tier, 0, brakLib.TIERS - 1)) return json({ error: "Invalid tier" }, 400);
    if (!isSession(b.sessionId)) return json({ error: "Invalid session" }, 400);
    return issue(userId, "brak", b.focus, b.tier, b.sessionId, brakLib.generateBrak(b.focus as brakLib.Focus, b.tier));
  }
  if (b.action === "answer") {
    if (!str(b.answer, 40)) return json({ error: "Invalid answer" }, 400);
    const row = await loadTask(userId, b.id, "brak");
    if (!row) return json({ error: "Task not found" }, 404);
    const task = row.task as brakLib.BrakTask;
    const r = brakLib.checkBrak(task, b.answer);
    if (!r) return json({ error: "Invalid answer" }, 400);
    const calc = b.calculatorUsed === true;
    // Warnings already given: earlier unsimplified right answers on steps 2–3 that kept full (warning) points.
    const { data: warnRows } = await admin.from("brak_attempts").select("points,calculator_used")
      .eq("user_id", userId).eq("is_correct", true).eq("unsimplified", true).gte("level", 1).lte("level", 2).limit(50);
    const warnings = (warnRows ?? []).filter((w) => Number(w.points) === (w.calculator_used ? 0.5 : 1)).length;
    const s = r.correct ? brakLib.scoreAnswer(row.level, r.unsimplified, warnings, calc) : { points: 0, warning: false };
    if (!(await claim(row.id))) return json({ error: "Task already answered" }, 409);
    const { data: prev } = await admin.from("brak_attempts").select("streak,streak_points,created_at").eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    const live = prev && Date.now() - new Date(prev.created_at).getTime() < STREAK_WINDOW_MS;
    const streak = r.correct ? (live ? prev.streak : 0) + 1 : 0;
    const streakPoints = r.correct ? (live ? Number(prev.streak_points) : 0) + s.points : 0;
    const { error } = await admin.from("brak_attempts").insert({
      user_id: userId, session_id: row.session_id, mode: row.mode, level: row.level, task_kind: task.kind, is_correct: r.correct,
      points: s.points, unsimplified: r.unsimplified, calculator_used: calc, hint_used: b.hintUsed === true, streak, streak_points: streakPoints,
    });
    if (error) { console.error("brak insert failed", error.message); return json({ error: "Could not save answer" }, 500); }
    return json({ correct: r.correct, points: s.points, warning: s.warning, warnings: warnings + (s.warning ? 1 : 0), streak, streakPoints });
  }
  return json({ error: "Invalid action" }, 400);
}

type AlgTask = { ex: alg.Exercise; step: "simplify" | "value" };
async function algebra(userId: string, b: Record<string, unknown>) {
  if (b.action === "issue") {
    if (b.mode !== "simplify" && b.mode !== "both") return json({ error: "Invalid mode" }, 400);
    if (!isInt(b.level, 0, alg.LEVELS[b.mode].length - 1)) return json({ error: "Invalid level" }, 400);
    if (!isSession(b.sessionId)) return json({ error: "Invalid session" }, 400);
    const ex = alg.generateExercise(b.mode, b.level);
    const res = await issue(userId, "algebra", b.mode, b.level, b.sessionId, { ex, step: "simplify" } satisfies AlgTask);
    if (res.status !== 200) return res;
    const { id } = await res.json();
    return json({ id, task: ex });
  }
  if (b.action === "answer") {
    if (!str(b.answer, 80)) return json({ error: "Invalid answer" }, 400);
    const row = await loadTask(userId, b.id, "algebra");
    if (!row) return json({ error: "Task not found" }, 404);
    const t = row.task as AlgTask;
    if (b.step !== t.step) return json({ error: "Wrong step" }, 409);
    const r = t.step === "simplify" ? alg.checkSimplified(t.ex, b.answer) : alg.checkValue(t.ex, b.answer);
    const finished = r.correct && (row.mode !== "both" || t.step === "value");
    if (r.correct && !finished) {
      const { data } = await admin.from("exercise_tasks").update({ task: { ...t, step: "value" } }).eq("id", row.id).is("answered_at", null).select("id");
      if (!data?.length) return json({ error: "Task changed" }, 409);
      return json({ correct: true, recorded: false });
    }
    if (finished && !(await claim(row.id))) return json({ error: "Task already answered" }, 409);
    const { error } = await admin.from("algebra_attempts").insert({ user_id: userId, session_id: row.session_id, mode: row.mode, level: row.level, is_correct: finished });
    if (error) { console.error("algebra insert failed", error.message); return json({ error: "Could not save answer" }, 500); }
    return json({ correct: r.correct, recorded: true });
  }
  return json({ error: "Invalid action" }, 400);
}

const SIDES = ["left", "right"];
function kistanMoves(v: unknown): kist.KistanMove[] | null {
  if (!Array.isArray(v) || v.length > 400) return null;
  const out: kist.KistanMove[] = [];
  for (const m of v) {
    if (!m || typeof m !== "object" || !SIDES.includes((m as { side: string }).side)) return null;
    const x = m as Record<string, unknown>; const side = x.side as kist.Side;
    if (x.a === "tile" && str(x.kind, 12) && typeof x.neg === "boolean") out.push({ a: "tile", kind: x.kind, neg: x.neg, side });
    else if (x.a === "op" && (x.op === "div" || x.op === "mul") && isInt(x.n, -1000, 1000)) out.push({ a: "op", op: x.op, n: x.n, side });
    else if (x.a === "wrap") out.push({ a: "wrap", side });
    else if (x.a === "pair" && isInt(x.i, 0, 99) && isInt(x.j, 0, 99)) out.push({ a: "pair", side, i: x.i, j: x.j });
    else return null;
  }
  return out;
}
async function kistan(userId: string, b: Record<string, unknown>) {
  if (b.action !== "solve") return json({ error: "Invalid action" }, 400);
  const level = kist.LEVELS.find((l) => l.id === b.levelId);
  const moves = kistanMoves(b.moves);
  if (!level || !moves) return json({ error: "Invalid solution" }, 400);
  const { data: rows } = await admin.from("kistan_progress").select("level_id,stars,best_moves").eq("user_id", userId);
  const progress: kist.ProgressMap = Object.fromEntries((rows ?? []).map((r) => [r.level_id, { stars: r.stars, best_moves: r.best_moves }]));
  if (!kist.isUnlocked(level.id, progress, await isAdminUser(userId))) return json({ error: "Level locked" }, 403);
  const end = kist.replayMoves(level.eq, moves);
  if (!end || !kist.isSolved(end)) return json({ error: "Not solved" }, 400);
  const stars = kist.stars(end.moves, kist.minMoves(kist.parseEquation(level.eq)));
  const best = kist.mergeBest(progress[level.id], stars, end.moves);
  if (best) {
    const { error } = await admin.from("kistan_progress").upsert(
      { user_id: userId, level_id: level.id, ...best, updated_at: new Date().toISOString() }, { onConflict: "user_id,level_id" });
    if (error) { console.error("kistan save failed", error.message); return json({ error: "Could not save" }, 500); }
  }
  return json({ stars, moves: end.moves, best: best ?? progress[level.id] });
}

const GG_SPREADS = gg.ROUND_LENGTH / gg.SPREAD_SIZE;
type GgTask = { questions: gg.Question[]; spreadIndex: number; carry: number; timed: boolean; points?: number };
async function ggLoad(userId: string) {
  const { data } = await admin.from("geometrigymmet_progress").select("progress").eq("user_id", userId).maybeSingle();
  return gg.parseProgress(data?.progress);
}
async function ggSave(userId: string, p: gg.Progress) {
  const { error } = await admin.from("geometrigymmet_progress").upsert(
    { user_id: userId, progress: p, mastered_count: gg.masteredCount(p), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) console.error("geometrigymmet save failed", error.message);
  return !error;
}
async function geometrigymmet(userId: string, b: Record<string, unknown>) {
  if (b.action === "timed") {
    if (typeof b.timed !== "boolean") return json({ error: "Invalid" }, 400);
    const p = { ...(await ggLoad(userId)), timed: b.timed };
    return (await ggSave(userId, p)) ? json({ progress: p }) : json({ error: "Could not save" }, 500);
  }
  if (b.action === "issue") {
    if (!isSession(b.sessionId)) return json({ error: "Invalid session" }, 400);
    const p = await ggLoad(userId);
    let spreadIndex = 0, carry = 0;
    if (typeof b.continueFrom === "string" && UUID.test(b.continueFrom)) {
      const { data: prev } = await admin.from("exercise_tasks").select("task,answered_at").eq("id", b.continueFrom).eq("user_id", userId).eq("game", "geometrigymmet").maybeSingle();
      const t = prev?.task as GgTask | undefined;
      if (prev?.answered_at && t && typeof t.points === "number" && t.spreadIndex + 1 < GG_SPREADS) { spreadIndex = t.spreadIndex + 1; carry = t.carry + t.points; }
    }
    const questions = gg.spreadQuestions(gg.nextSkill(p));
    const res = await issue(userId, "geometrigymmet", questions[0].skillId.slice(0, 40), spreadIndex, b.sessionId,
      { questions, spreadIndex, carry, timed: p.timed } satisfies GgTask);
    if (res.status !== 200) return res;
    const { id } = await res.json();
    return json({ id, task: { questions, spreadIndex, roundPoints: carry } });
  }
  if (b.action === "answer") {
    const inputs = b.inputs, units = b.units;
    const okList = (v: unknown) => Array.isArray(v) && v.length === gg.SPREAD_SIZE && v.every((x) => typeof x === "string" && x.length <= 20);
    if (!okList(inputs) || !okList(units)) return json({ error: "Invalid answer" }, 400);
    const row = await loadTask(userId, b.id, "geometrigymmet");
    if (!row) return json({ error: "Task not found" }, 404);
    const t = row.task as GgTask;
    const results = gg.gradeSpread(t.questions, inputs as string[], units as string[]);
    const elapsed = (Date.now() - new Date(row.created_at).getTime()) / 1000;
    const client = typeof b.seconds === "number" && Number.isFinite(b.seconds) ? b.seconds : elapsed;
    // A spread can never be faster than one second per box, nor slower than the time since it was handed out.
    const seconds = t.timed ? Math.min(elapsed, Math.max(gg.SPREAD_SIZE, client)) : null;
    const r = gg.applySpread(await ggLoad(userId), t.questions, results, seconds, t.spreadIndex + 1 >= GG_SPREADS, t.carry);
    const { data } = await admin.from("exercise_tasks").update({ task: { ...t, points: r.points }, answered_at: new Date().toISOString() })
      .eq("id", row.id).is("answered_at", null).select("id");
    if (!data?.length) return json({ error: "Task already answered" }, 409);
    if (!(await ggSave(userId, r.progress))) return json({ error: "Could not save" }, 500);
    return json({ results, seconds, ...r });
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
    if (b.game === "koordinat") return await koordinat(auth.userId, b);
    if (b.game === "linje") return await linjen(auth.userId, b);
    if (b.game === "sannolikhet") return await sannolikhet(auth.userId, b);
    if (b.game === "brak") return await brak(auth.userId, b);
    if (b.game === "algebra") return await algebra(auth.userId, b);
    if (b.game === "kistan") return await kistan(auth.userId, b);
    if (b.game === "geometrigymmet") return await geometrigymmet(auth.userId, b);
    return json({ error: "Invalid game" }, 400);
  } catch (e) {
    console.error("exercise-task error", e instanceof Error ? e.message : e);
    return json({ error: "Internal error" }, 500);
  }
});

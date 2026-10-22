import { decideAccess, type UserLike } from "../_shared/braklabbet-access.ts";
import { gradeComparison } from "../_shared/braklabbet-exercises.js";

type Result<T> = { data: T | null; error: unknown };
export type AnswerInput = { request_id: string; exercise_id: number; answer: string; hint_used: boolean };
export function parseAnswerInput(value: unknown): AnswerInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const d = value as Record<string, unknown>;
  if (Object.keys(d).sort().join(",") !== "answer,exercise_id,hint_used,request_id") return null;
  if (typeof d.request_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(d.request_id)) return null;
  if (typeof d.exercise_id !== "number" || !Number.isInteger(d.exercise_id) || d.exercise_id < 1 || d.exercise_id > 20) return null;
  if (typeof d.answer !== "string" || !d.answer.trim() || d.answer.length > 2000 || typeof d.hint_used !== "boolean") return null;
  return { request_id: d.request_id, exercise_id: d.exercise_id, answer: d.answer.trim(), hint_used: d.hint_used };
}
export interface AnswerDeps {
  headers: Record<string, string>;
  getUser: (token: string) => Promise<Result<{ user: UserLike | null }>>;
  getAdminRoles: (id: string) => Promise<Result<unknown[]>>;
  getAccessStatus: (id: string) => Promise<Result<{ status: string }>>;
  record: (userId: string, input: AnswerInput, correct: boolean) => Promise<Result<unknown>>;
}
export async function handleAnswer(req: Request, deps: AnswerDeps): Promise<Response> {
  const json = (status: number, data: unknown) => new Response(JSON.stringify(data), {
    status, headers: { ...deps.headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
  if (req.method === "OPTIONS") return new Response("ok", { headers: deps.headers });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (!token) return json(401, { error: "unauthorized" });
    const identity = await deps.getUser(token);
    const user = identity.data?.user;
    if (identity.error || !user) return json(401, { error: "unauthorized" });
    const [roles, access] = await Promise.all([deps.getAdminRoles(user.id), deps.getAccessStatus(user.id)]);
    if (roles.error || access.error) return json(503, { error: "access_check_failed" });
    const decision = decideAccess(user, (roles.data?.length ?? 0) > 0, access.data?.status ?? null);
    if (!decision.allowed) return json(403, { error: "forbidden" });
    if (Number(req.headers.get("content-length") ?? 0) > 12000) return json(413, { error: "answer_too_large" });
    const body = await req.text();
    if (body.length > 12000) return json(413, { error: "answer_too_large" });
    let parsed: unknown;
    try { parsed = JSON.parse(body); } catch { return json(400, { error: "invalid_json" }); }
    const input = parseAnswerInput(parsed);
    if (!input) return json(400, { error: "invalid_answer" });
    const grade = gradeComparison(input.exercise_id, input.answer);
    if (!grade.valid) return json(400, { error: grade.error });
    const saved = await deps.record(user.id, input, grade.correct === true);
    if (saved.error || !saved.data) return json(503, { error: "answer_not_saved" });
    return json(200, { row: saved.data });
  } catch { return json(500, { error: "answer_not_saved" }); }
}
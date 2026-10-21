export type TrainingAnswer = {
  request_id: string; exercise_id: number; answer: string; hint_used: boolean;
};
export function parseTrainingMessage(data: unknown): TrainingAnswer | "ready" | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const d = data as Record<string, unknown>;
  if (d.type === "braklabbet:training-ready" && Object.keys(d).length === 1) return "ready";
  if (Object.keys(d).sort().join(",") !== "answer,exercise_id,hint_used,request_id,type" || d.type !== "braklabbet:training-answer") return null;
  if (typeof d.request_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(d.request_id)) return null;
  if (typeof d.exercise_id !== "number" || !Number.isInteger(d.exercise_id) || d.exercise_id < 1 || d.exercise_id > 20) return null;
  if (typeof d.answer !== "string" || !d.answer.trim() || d.answer.length > 2000 || typeof d.hint_used !== "boolean") return null;
  return { request_id: d.request_id, exercise_id: d.exercise_id, answer: d.answer, hint_used: d.hint_used };
}
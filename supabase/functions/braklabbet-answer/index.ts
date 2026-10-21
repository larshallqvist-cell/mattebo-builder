import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { handleAnswer } from "./handler.ts";

const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
Deno.serve(req => handleAnswer(req, {
  headers: corsHeaders,
  getUser: token => admin.auth.getUser(token),
  getAdminRoles: id => admin.from("user_roles").select("role").eq("user_id", id).eq("role", "admin"),
  getAccessStatus: id => admin.from("access_requests").select("status").eq("user_id", id).maybeSingle(),
  record: async (userId, input, correct) => {
    const { data, error } = await admin.rpc("record_braklabbet_attempt", {
      p_id: input.request_id, p_user_id: userId, p_exercise_id: input.exercise_id,
      p_answer: input.answer, p_is_correct: correct, p_hint_used: input.hint_used,
    });
    const row = Array.isArray(data) ? data[0] : data;
    return { error, data: row ? {
      id: row.id, exercise_id: row.exercise_id, answer: row.answer, is_correct: row.is_correct,
      attempt_number: row.attempt_number, hint_used: row.hint_used, answered_at: row.answered_at,
    } : null };
  },
}));
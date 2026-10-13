import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { decideAccess } from "./access.ts";
import { BRAKLABBET_HTML } from "./content.ts";

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return json(401, { error: "unauthorized" });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  // Verifies the real session against the auth server (rejects anon key, expired or forged JWTs).
  const { data, error } = await admin.auth.getUser(token);
  const user = data?.user;
  if (error || !user) return json(401, { error: "unauthorized" });

  const [{ data: roles }, { data: request }] = await Promise.all([
    admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin"),
    admin.from("access_requests").select("status").eq("user_id", user.id).maybeSingle(),
  ]);

  const decision = decideAccess(user, (roles?.length ?? 0) > 0, request?.status ?? null);
  if (!decision.allowed) return json(403, { error: "forbidden", reason: decision.reason });

  return json(200, { html: BRAKLABBET_HTML });
});

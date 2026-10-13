import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { handle } from "./handler.ts";
import { BRAKLABBET_HTML } from "./content.ts";

const admin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

Deno.serve((req) =>
  handle(req, {
    // Verifies the real session against the auth server (rejects anon key, expired or forged JWTs).
    getUser: (token) => admin.auth.getUser(token),
    getAdminRoles: (id) => admin.from("user_roles").select("role").eq("user_id", id).eq("role", "admin"),
    getAccessStatus: (id) => admin.from("access_requests").select("status").eq("user_id", id).maybeSingle(),
    html: BRAKLABBET_HTML,
    headers: corsHeaders,
  })
);

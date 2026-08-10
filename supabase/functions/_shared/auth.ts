import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthResult {
  userId: string | null;
  error: Response | null;
}

/**
 * Verifies the caller's Supabase JWT and that the user has approved access
 * (or is an admin). Returns a ready-to-send error Response when not allowed.
 */
export async function requireApprovedUser(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<AuthResult> {
  const deny = (status: number, message: string): AuthResult => ({
    userId: null,
    error: new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }),
  });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return deny(401, "Unauthorized");

  const token = authHeader.replace("Bearer ", "");

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  const { data, error } = await anonClient.auth.getClaims(token);
  const userId = data?.claims?.sub as string | undefined;
  if (error || !userId) return deny(401, "Unauthorized");

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (roleRow) return { userId, error: null };

  const { data: request } = await admin
    .from("access_requests")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  if (request?.status !== "approved") return deny(403, "Access not approved");

  return { userId, error: null };
}

import { decideAccess, type UserLike } from "./access.ts";

type Result<T> = { data: T | null; error: unknown };

export interface Deps {
  getUser: (token: string) => Promise<Result<{ user: UserLike | null }>>;
  getAdminRoles: (userId: string) => Promise<Result<unknown[]>>;
  getAccessStatus: (userId: string) => Promise<Result<{ status: string } | null>>;
  html: string;
  headers: Record<string, string>;
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  const json = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...deps.headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: deps.headers });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (!token) return json(401, { error: "unauthorized" });

    const { data, error } = await deps.getUser(token);
    const user = data?.user;
    if (error || !user) return json(401, { error: "unauthorized" });

    const [roles, request] = await Promise.all([
      deps.getAdminRoles(user.id),
      deps.getAccessStatus(user.id),
    ]);
    // Fail closed: without a reliable role/denied check we never serve the lab.
    if (roles.error || request.error) {
      return json(503, { error: "access_check_failed", message: "Behörigheten kunde inte kontrolleras. Försök igen om en stund." });
    }

    const decision = decideAccess(user, (roles.data?.length ?? 0) > 0, request.data?.status ?? null);
    if (!decision.allowed) return json(403, { error: "forbidden", reason: decision.reason });

    return json(200, { html: deps.html });
  } catch {
    return json(500, { error: "server_error", message: "Ett oväntat serverfel uppstod. Försök igen." });
  }
}

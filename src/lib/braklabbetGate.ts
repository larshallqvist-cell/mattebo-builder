/** The only approved post-login return path (student Bråklabbet). Other login buttons go to the start page. */
export const ALLOWED_RETURN_PATHS = ["/braklabbet"] as const;

export const isAllowedReturnPath = (path: unknown): path is string =>
  typeof path === "string" && (ALLOWED_RETURN_PATHS as readonly string[]).includes(path);

/** Identity key: a new check is required when either the account or its confirmed email changes. */
export const labAccountKey = (userId: string | null | undefined, email: string | null | undefined) =>
  userId ? `${userId}|${(email ?? "").toLowerCase()}` : null;

/** The lab document may only be shown for the exact account it was fetched for, and never while auth loads. */
export const canShowLab = (
  lab: { kind: string; key?: string | null },
  currentKey: string | null,
  authLoading: boolean,
) => !authLoading && currentKey !== null && lab.kind === "ready" && lab.key === currentKey;

/** Known mission IDs; must match the DB check constraint on braklabbet_progress. */
export const KNOWN_MISSIONS = ["extend-by-two"] as const;

/** Accepts only `{ type: "braklabbet:mission-complete", mission: <known id> }` with no extra keys. */
export const parseMissionMessage = (data: unknown): string | null => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const keys = Object.keys(data).sort();
  if (keys.length !== 2 || keys[0] !== "mission" || keys[1] !== "type") return null;
  const { type, mission } = data as Record<string, unknown>;
  if (type !== "braklabbet:mission-complete" || typeof mission !== "string") return null;
  return (KNOWN_MISSIONS as readonly string[]).includes(mission) ? mission : null;
};

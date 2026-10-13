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

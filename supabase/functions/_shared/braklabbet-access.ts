// Pure access decision for the student Bråklabbet. Never reads user_metadata.

export const SCHOOL_DOMAIN = "leteboskolan.se";

export interface IdentityLike {
  provider?: string;
  identity_data?: Record<string, unknown> | null;
}

export interface UserLike {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  identities?: IdentityLike[] | null;
}

export type Decision =
  | { allowed: true; reason: "admin" | "school" }
  | { allowed: false; status: 403; reason: "denied" | "wrong_domain" | "not_google" | "unverified" };

/** Exact domain match, case-insensitive. Rejects suffix/subdomain tricks. */
export function isSchoolEmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  const e = email.trim().toLowerCase();
  const parts = e.split("@");
  if (parts.length !== 2 || !parts[0]) return false;
  return parts[1] === SCHOOL_DOMAIN;
}

/** Returns the verified Google email that matches the account email, or null. */
export function verifiedGoogleEmail(user: UserLike): string | null {
  if (!user.email || !user.email_confirmed_at) return null;
  const accountEmail = user.email.trim().toLowerCase();
  for (const id of user.identities ?? []) {
    if (id.provider !== "google") continue;
    const data = id.identity_data ?? {};
    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    if (email && email === accountEmail && data.email_verified === true) return email;
  }
  return null;
}

export function decideAccess(
  user: UserLike,
  isAdmin: boolean,
  accessStatus: string | null,
): Decision {
  if (isAdmin) return { allowed: true, reason: "admin" };
  if (accessStatus === "denied") return { allowed: false, status: 403, reason: "denied" };
  const hasGoogle = (user.identities ?? []).some((i) => i.provider === "google");
  if (!hasGoogle) return { allowed: false, status: 403, reason: "not_google" };
  const email = verifiedGoogleEmail(user);
  if (!email) return { allowed: false, status: 403, reason: "unverified" };
  if (!isSchoolEmail(email)) return { allowed: false, status: 403, reason: "wrong_domain" };
  return { allowed: true, reason: "school" };
}

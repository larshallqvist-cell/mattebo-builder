export const OAUTH_CONSENT_PATH = "/.lovable/oauth/consent";

export function oauthReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return "/";
  // A fixed parsing origin keeps validation independent of the current page.
  const origin = "https://app.invalid";
  try {
    const target = new URL(value, origin);
    if (target.origin !== origin || target.pathname.startsWith("//")) return "/";
    return target.pathname + target.search + target.hash;
  } catch {
    return "/";
  }
}

/** Returns the canonical consent path (with its query) or null when the value is anything else. */
export function consentReturnPath(value: unknown): string | null {
  const path = oauthReturnPath(value);
  return path.startsWith(OAUTH_CONSENT_PATH + "?") ? path : null;
}

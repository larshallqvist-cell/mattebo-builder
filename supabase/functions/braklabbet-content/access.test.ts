import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { decideAccess, isSchoolEmail, type UserLike } from "./access.ts";

const google = (email: string, verified = true): UserLike => ({
  id: "00000000-0000-0000-0000-000000000001",
  email,
  email_confirmed_at: "2026-01-01T00:00:00Z",
  identities: [{ provider: "google", identity_data: { email, email_verified: verified } }],
});

Deno.test("verified school Google account is allowed", () => {
  assertEquals(decideAccess(google("elev.test@leteboskolan.se"), false, null).allowed, true);
  assertEquals(decideAccess(google("Elev.Test@LETEBOSKOLAN.SE"), false, "pending").allowed, true);
});

Deno.test("other domain and fake suffixes are denied", () => {
  for (const e of ["a@gmail.com", "a@leteboskolan.se.evil", "a@evilleteboskolan.se", "a@sub.leteboskolan.se", "a@b@leteboskolan.se", "@leteboskolan.se"]) {
    assertEquals(isSchoolEmail(e), false, e);
    assertEquals(decideAccess(google(e), false, null).allowed, false, e);
  }
});

Deno.test("unverified Google email is denied", () => {
  assertEquals(decideAccess(google("a@leteboskolan.se", false), false, null), { allowed: false, status: 403, reason: "unverified" });
  const u = google("a@leteboskolan.se");
  u.email_confirmed_at = null;
  assertEquals(decideAccess(u, false, null).allowed, false);
});

Deno.test("non-Google identity is denied", () => {
  const u: UserLike = { id: "x", email: "a@leteboskolan.se", email_confirmed_at: "2026-01-01", identities: [{ provider: "email", identity_data: { email: "a@leteboskolan.se", email_verified: true } }] };
  assertEquals(decideAccess(u, false, null), { allowed: false, status: 403, reason: "not_google" });
});

Deno.test("manipulated user_metadata cannot grant access", () => {
  const u = { ...google("a@gmail.com"), user_metadata: { email: "a@leteboskolan.se", hd: "leteboskolan.se" } } as UserLike;
  assertEquals(decideAccess(u, false, null).allowed, false);
  // Google identity email differing from account email is rejected.
  const mismatch = google("a@gmail.com");
  mismatch.identities![0].identity_data!.email = "a@leteboskolan.se";
  assertEquals(decideAccess(mismatch, false, null).allowed, false);
});

Deno.test("manually denied school account is blocked", () => {
  assertEquals(decideAccess(google("a@leteboskolan.se"), false, "denied"), { allowed: false, status: 403, reason: "denied" });
});

Deno.test("existing admin is allowed with any account", () => {
  assertEquals(decideAccess(google("teacher@gmail.com"), true, null), { allowed: true, reason: "admin" });
});

Deno.test("lookalike domains are denied", () => {
  for (const e of ["a@leteboskolan.com", "a@letebo-skolan.se", "a@leteboskolan.se.", "a@1eteboskolan.se"]) {
    assertEquals(decideAccess(google(e), false, null).allowed, false, e);
  }
});

Deno.test("admin who is also denied: admin wins (deliberate, so the teacher can never lock himself out)", () => {
  assertEquals(decideAccess(google("teacher@gmail.com"), true, "denied"), { allowed: true, reason: "admin" });
});

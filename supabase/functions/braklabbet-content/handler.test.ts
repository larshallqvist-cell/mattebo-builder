import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handle, type Deps } from "./handler.ts";

const HTML = "<html>LAB</html>";
const school = {
  id: "u1",
  email: "elev@leteboskolan.se",
  email_confirmed_at: "2026-01-01",
  identities: [{ provider: "google", identity_data: { email: "elev@leteboskolan.se", email_verified: true } }],
};
const ok = <T>(data: T) => Promise.resolve({ data, error: null });
const fail = () => Promise.resolve({ data: null, error: { message: "db down" } });
const deps = (o: Partial<Deps> = {}): Deps => ({
  getUser: () => ok({ user: school }),
  getAdminRoles: () => ok([]),
  getAccessStatus: () => ok(null),
  html: HTML,
  headers: {},
  ...o,
});
const call = async (d: Deps) => {
  const r = await handle(new Request("http://x", { method: "POST", headers: { Authorization: "Bearer t" } }), d);
  const text = await r.text();
  return { status: r.status, text, cache: r.headers.get("Cache-Control") };
};

Deno.test("school account gets the lab", async () => {
  const r = await call(deps());
  assertEquals(r.status, 200);
  assertEquals(r.text.includes("LAB"), true);
});

Deno.test("user_roles error returns 503 without HTML", async () => {
  const r = await call(deps({ getAdminRoles: fail }));
  assertEquals([r.status, r.text.includes("LAB"), r.cache], [503, false, "no-store"]);
});

Deno.test("access_requests error returns 503 without HTML", async () => {
  const r = await call(deps({ getAccessStatus: fail }));
  assertEquals([r.status, r.text.includes("LAB"), r.cache], [503, false, "no-store"]);
});

Deno.test("unexpected exception returns 500 without HTML", async () => {
  const r = await call(deps({ getAccessStatus: () => Promise.reject(new Error("boom")) }));
  assertEquals([r.status, r.text.includes("LAB"), r.cache], [500, false, "no-store"]);
  const r2 = await call(deps({ getUser: () => Promise.reject(new Error("boom")) }));
  assertEquals([r2.status, r2.text.includes("LAB")], [500, false]);
});

Deno.test("denied school account gets 403", async () => {
  const r = await call(deps({ getAccessStatus: () => ok({ status: "denied" }) }));
  assertEquals([r.status, r.text.includes("LAB")], [403, false]);
});

Deno.test("signed-out request (no token) gets 401 without HTML", async () => {
  const r = await handle(new Request("http://x", { method: "POST" }), deps());
  assertEquals([r.status, (await r.text()).includes("LAB")], [401, false]);
});

Deno.test("invalid session gets 401 without HTML", async () => {
  const r = await call(deps({ getUser: () => ok({ user: null }) }));
  assertEquals([r.status, r.text.includes("LAB")], [401, false]);
});

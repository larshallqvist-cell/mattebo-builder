import { describe, expect, test } from "bun:test";
import { canShowLab, isAllowedReturnPath, labAccountKey } from "../src/lib/braklabbetGate";

describe("post-login return path", () => {
  test("only /braklabbet is accepted", () => {
    expect(isAllowedReturnPath("/braklabbet")).toBe(true);
    for (const p of ["/admin", "/", "//evil.com", "https://evil.com", "/braklabbet/x", "", null, {}]) {
      expect(isAllowedReturnPath(p)).toBe(false);
    }
  });
});

describe("lab iframe gate", () => {
  const a = labAccountKey("user-a", "a@leteboskolan.se");
  const b = labAccountKey("user-b", "b@leteboskolan.se");
  const ready = { kind: "ready", key: a };

  test("shown for the account it was fetched for", () => {
    expect(canShowLab(ready, a, false)).toBe(true);
  });
  test("hidden after switching account", () => {
    expect(canShowLab(ready, b, false)).toBe(false);
  });
  test("hidden when the confirmed email changes", () => {
    expect(canShowLab(ready, labAccountKey("user-a", "other@gmail.com"), false)).toBe(false);
  });
  test("hidden after logout", () => {
    expect(canShowLab(ready, labAccountKey(null, null), false)).toBe(false);
  });
  test("hidden while auth is loading", () => {
    expect(canShowLab(ready, a, true)).toBe(false);
  });
});

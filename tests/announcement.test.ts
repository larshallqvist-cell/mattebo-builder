import { describe, expect, test } from "bun:test";
import { flashDurationMs, isExpired, seenKey, shouldShow } from "../src/lib/announcement";

const base = { content: "Glöm inte linjal", expiresOn: null, updatedAt: "t1", grade: 7, today: "2026-10-29", lastSeen: null };

describe("announcement flash", () => {
  test("short text shows 3 seconds", () => {
    expect(flashDurationMs("Glöm inte linjal")).toBe(3000);
  });
  test("long text gets longer but max 8 seconds", () => {
    expect(flashDurationMs("x".repeat(140))).toBe(5000);
    expect(flashDurationMs("x".repeat(2000))).toBe(8000);
  });
  test("shows once per day", () => {
    expect(shouldShow(base)).toBe(true);
    expect(shouldShow({ ...base, lastSeen: seenKey(7, "t1", "2026-10-29") })).toBe(false);
    expect(shouldShow({ ...base, lastSeen: seenKey(7, "t1", "2026-10-28") })).toBe(true);
  });
  test("an edited announcement shows again the same day", () => {
    expect(shouldShow({ ...base, updatedAt: "t2", lastSeen: seenKey(7, "t1", "2026-10-29") })).toBe(true);
  });
  test("end date still shows that day, hidden after", () => {
    expect(isExpired("2026-10-29", "2026-10-29")).toBe(false);
    expect(shouldShow({ ...base, expiresOn: "2026-10-28" })).toBe(false);
  });
  test("empty text never shows", () => {
    expect(shouldShow({ ...base, content: "  " })).toBe(false);
  });
});

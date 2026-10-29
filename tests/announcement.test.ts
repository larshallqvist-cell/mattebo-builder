import { describe, expect, test } from "bun:test";
import { autoClosesAfterMs, isExpired, seenKey, shouldShow } from "../src/lib/announcement";

const base = { content: "Glöm inte linjal", expiresOn: null, updatedAt: "t1", grade: 7, today: "2026-10-29", lastSeen: null };

describe("announcement flash", () => {
  test("stays open until closed by the user (no timed auto-hide)", () => {
    expect(autoClosesAfterMs).toBe(null);
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

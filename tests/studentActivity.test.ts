import { expect, test } from "bun:test";
import { activeElapsed, summarizeStudents, formatActiveTime, resumeVisit, type Visit } from "../src/lib/studentActivity";

test("active time stops after 60 seconds without interaction", () => {
  expect(activeElapsed(55_000, 65_000, 0, true)).toBe(5_000);
  expect(activeElapsed(65_000, 90_000, 0, true)).toBe(0);
});
test("hidden or unfocused tabs accrue no active time", () => {
  expect(activeElapsed(0, 30_000, 0, false)).toBe(0);
});
test("visits resume on page changes but restart after 30 minutes or account change", () => {
  const saved = { userId: "a", visitId: "old", lastSeen: 0 };
  expect(resumeVisit(saved, "a", 1_799_999, "new")).toBe("old");
  expect(resumeVisit(saved, "a", 1_800_000, "new")).toBe("new");
  expect(resumeVisit(saved, "b", 1, "new")).toBe("new");
});
const students = [{ user_id: "a", full_name: "Elev A", last_sign_in_at: null }, { user_id: "b", full_name: "Elev B", last_sign_in_at: null }];
const visit = (id: string, visitId: string, user: string, path: string, seconds: number): Visit => ({ id, visit_id: visitId, user_id: user, path, active_seconds: seconds, started_at: "2026-10-24T10:00:00Z", last_seen_at: "2026-10-24T10:05:00Z" });
test("one visit across pages counts once; each student's time stays separate", () => {
  const rows = summarizeStudents(students, [visit("1", "v1", "a", "/algebra", 60), visit("2", "v1", "a", "/ak6", 120), visit("3", "v2", "a", "/", 10), visit("4", "v3", "b", "/ak7", 30)], [], 0);
  expect(rows.find((r) => r.user_id === "a")).toMatchObject({ visits: 2, activeSeconds: 190 });
  expect(rows.find((r) => r.user_id === "b")).toMatchObject({ visits: 1, activeSeconds: 30 });
});
test("existing exercises show activity even without tracked visits; period excludes old rows", () => {
  const events = [{ id: "e", userId: "b", at: "2026-10-24T12:00:00Z", label: "Algebra – nivå 3, rätt" }];
  const rows = summarizeStudents(students, [visit("1", "v", "a", "/algebra", 60)], events, Date.parse("2026-10-24T11:00:00Z"));
  expect(rows[0]).toMatchObject({ user_id: "b", visits: 0, activeSeconds: 0, activities: ["Algebra"], lastAt: events[0].at });
  expect(rows[1].visits).toBe(0);
});
test("time is an estimate in minutes, not falsely precise", () => {
  expect(formatActiveTime(0)).toBe("—");
  expect(formatActiveTime(35)).toBe("< 1 min");
  expect(formatActiveTime(3725)).toBe("1 h 2 min");
});
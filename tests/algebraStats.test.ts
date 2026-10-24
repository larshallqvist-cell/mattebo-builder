import { describe, expect, test } from "bun:test";
import { buildStats, levelStatus } from "../src/lib/algebraStats";

describe("levelStatus", () => {
  test("mastered needs at least 5 answers and 80 %", () => {
    expect(levelStatus(4, 5)).toBe("mastered");
    expect(levelStatus(4, 4)).toBe("practicing");
  });
  test("50–79 % is practicing", () => expect(levelStatus(5, 10)).toBe("practicing"));
  test("under 50 % is struggling", () => expect(levelStatus(4, 10)).toBe("struggling"));
  test("no answers is none", () => expect(levelStatus(0, 0)).toBe("none"));
});

test("last pass is the newest session; totals span all sessions", () => {
  const a = (s: string, level: number, ok: boolean, t: string) => ({ user_id: "u", session_id: s, mode: "simplify", level, is_correct: ok, created_at: t });
  const [s] = buildStats([a("old", 0, true, "2026-01-01"), a("old", 0, false, "2026-01-02"), a("new", 2, true, "2026-02-01")]);
  expect(s.last).toMatchObject({ right: 1, total: 1, levels: [2] });
  expect(s.total).toBe(3);
  expect(s.levels[0]).toMatchObject({ right: 1, total: 2 });
});

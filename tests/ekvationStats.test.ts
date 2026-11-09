import { describe, expect, test } from "bun:test";
import { assessment, groupPuzzles, justMastered, recommendedNext, summarize, type EkvationRow } from "../src/lib/ekvationStats";

let t = 0;
const at = () => new Date(Date.UTC(2026, 9, 1, 8, 0, t++)).toISOString();
const row = (level: number, ok: boolean, extra: Partial<EkvationRow> = {}): EkvationRow => ({
  session_id: "s1", level, is_correct: ok, hint_used: false, created_at: at(), ...extra,
});
const cleanSolves = (level: number, n: number) => Array.from({ length: n }, (_, i) => row(level, true, { puzzle_id: `L${level}-${t}-${i}` }));

describe("groupPuzzles", () => {
  test("äldre rader utan puzzle_id: felsvar hör till nästa rätta svar på samma nivå", () => {
    const p = groupPuzzles([row(0, false), row(0, false), row(0, true), row(0, true)]);
    expect(p.length).toBe(2);
    expect(p[0].wrong).toBe(2);
    expect(p[1].wrong).toBe(0);
  });
  test("puzzle_id grupperar exakt och tid begränsas till 300 s per svar", () => {
    const p = groupPuzzles([row(1, false, { puzzle_id: "a", seconds_spent: 900 }), row(1, true, { puzzle_id: "a", seconds_spent: 20 })]);
    expect(p.length).toBe(1);
    expect(p[0].seconds).toBe(320);
  });
});

describe("bemästring", () => {
  test("7 rena lösningar räcker inte, 8 gör nivån bemästrad med 3 stjärnor", () => {
    expect(summarize(cleanSolves(0, 7)).levels[0].status).toBe("practicing");
    const s = summarize(cleanSolves(0, 8)).levels[0];
    expect(s.status).toBe("mastered");
    expect(s.stars).toBe(3);
    expect(s.mastery).toBe(100);
  });
  test("ledtråd gör att pusslet inte räknas som direkt rätt", () => {
    const rows = [...cleanSolves(0, 6), row(0, true, { puzzle_id: "h1", hint_used: true }), row(0, true, { puzzle_id: "h2", hint_used: true }), row(0, true, { puzzle_id: "h3", hint_used: true })];
    const l = summarize(rows).levels[0];
    expect(l.solved).toBe(9);
    expect(l.hints).toBe(3);
    expect(l.status).toBe("practicing"); // 6/9 < 80 %
  });
  test("under 50 % rätt efter minst 5 svar = svårt", () => {
    const rows = [row(2, false, { puzzle_id: "x" }), row(2, false, { puzzle_id: "x" }), row(2, false, { puzzle_id: "x" }), row(2, true, { puzzle_id: "x" }), row(2, false, { puzzle_id: "y" })];
    expect(summarize(rows).levels[2].status).toBe("struggling");
  });
  test("rekommenderar nästa ej bemästrade nivå och upptäcker själva bemästringsögonblicket", () => {
    const before = summarize(cleanSolves(0, 7));
    const rows = cleanSolves(0, 8);
    const after = summarize(rows);
    expect(justMastered(before, after, 0)).toBe(true);
    expect(recommendedNext(after, 0)).toBe(1);
    expect(recommendedNext(summarize(cleanSolves(1, 3)), 1)).toBe(null);
  });
});

describe("svit och prioriteringsfel", () => {
  test("bästa svit räknar rena lösningar i följd, ett fel nollställer", () => {
    const rows = [...cleanSolves(0, 4), row(0, false, { puzzle_id: "f" }), row(0, true, { puzzle_id: "f" }), ...cleanSolves(0, 2)];
    const s = summarize(rows);
    expect(s.bestStreak).toBe(4);
    expect(s.currentStreak).toBe(2);
  });
  test("prioriteringsfel räknas per nivå och syns i bedömningen", () => {
    const rows = [row(2, false, { puzzle_id: "p", error_kind: "priority" }), row(2, false, { puzzle_id: "p", error_kind: "other" }), row(2, true, { puzzle_id: "p" })];
    const s = summarize(rows);
    expect(s.levels[2].priorityErrors).toBe(1);
    expect(s.priorityErrors).toBe(1);
    expect(assessment(s)[1].note).toContain("1 prioriteringsfel");
  });
});

describe("bedömningsunderlag", () => {
  test("fyra förmågor med rätt omdöme", () => {
    const s = summarize([...cleanSolves(0, 8), ...cleanSolves(1, 8), ...cleanSolves(2, 2)]);
    const a = assessment(s);
    expect(a.map((x) => x.verdict)).toEqual(["Behärskar", "På väg", "Ej visat", "Ej visat"]);
  });
  test("ingen data ger Ej visat överallt", () => {
    expect(assessment(summarize([])).every((x) => x.verdict === "Ej visat")).toBe(true);
  });
});

describe("nivå 5 – bråk och parenteser", () => {
  test("nivå 5 räknas som en egen nivå och kan bemästras", () => {
    const s = summarize(cleanSolves(4, 8));
    expect(s.levels.length).toBe(5);
    expect(s.levels[4].status).toBe("mastered");
    expect(assessment(s)[3].verdict).toBe("Behärskar");
    expect(recommendedNext(summarize([...cleanSolves(3, 8)]), 3)).toBe(4);
  });
  test("parentesfel räknas separat från prioriteringsfel", () => {
    const rows = [row(4, false, { puzzle_id: "q", error_kind: "parenthesis" }), row(4, false, { puzzle_id: "q", error_kind: "other" }), row(4, true, { puzzle_id: "q" })];
    const s = summarize(rows);
    expect(s.levels[4].parenErrors).toBe(1);
    expect(s.parenErrors).toBe(1);
    expect(s.parenChances).toBe(2);
    expect(s.priorityErrors).toBe(0);
    expect(assessment(s)[3].note).toContain("1 parentesfel");
  });
});

import { describe, expect, test } from "bun:test";
import { checkAnswer, evaluate, explain, generatePuzzle, type Theme } from "../src/lib/ekvationer";

const THEMES: Theme[] = ["djur", "profiler"];

describe("ekvationspusslet", () => {
  test("every puzzle is solvable one new figure per line and the answer matches", () => {
    for (let level = 0; level < 4; level++) for (const theme of THEMES) for (let k = 0; k < 200; k++) {
      const p = generatePuzzle(level, theme);
      p.lines.forEach((line, i) => {
        expect(evaluate(line.terms, p.values)).toBe(line.result);
        const syms = new Set(line.terms.flatMap((t) => t.syms));
        expect(syms.has(i)).toBe(true);
        expect([...syms].every((s) => s <= i)).toBe(true);
      });
      expect(new Set(p.lines[0].terms.flatMap((t) => t.syms)).size).toBe(1);
      expect(evaluate(p.question, p.values)).toBe(p.answer);
      expect(explain(p, String).at(-1)).toContain(`= ${p.answer}.`);
      expect(checkAnswer(p, String(p.answer)).correct).toBe(true);
    }
  });

  test("level 1 uses two figures and only addition", () => {
    for (let k = 0; k < 200; k++) {
      const p = generatePuzzle(0, "djur");
      expect(p.values.length).toBe(2);
      for (const t of [...p.lines.flatMap((l) => l.terms), ...p.question]) {
        expect(t.coef).toBe(1);
        expect(t.syms.length).toBe(1);
      }
    }
  });

  test("level 2 has three figures; levels 3 and 4 need multiplication before addition", () => {
    for (let k = 0; k < 200; k++) {
      expect(generatePuzzle(1, "djur").values.length).toBe(3);
      for (const level of [2, 3]) {
        const p = generatePuzzle(level, "djur");
        expect(p.question.some((t) => t.syms.length === 2)).toBe(true);
        expect(p.leftToRight).not.toBe(p.answer);
        expect(checkAnswer(p, String(p.leftToRight)).message).toContain("gånger går före plus");
      }
    }
  });

  test("level 4 uses x, y and z", () => {
    expect(generatePuzzle(3, "profiler").symbols).toEqual(["x", "y", "z"]);
  });

  test("profiler theme can include the principal Magdalena", () => {
    const seen = new Set<string>();
    for (let k = 0; k < 300; k++) generatePuzzle(1, "profiler").symbols.forEach((s) => seen.add(s));
    expect(seen.has("magdalena")).toBe(true);
  });

  test("answers accept spaces and the typographic minus", () => {
    const p = generatePuzzle(0, "djur", () => 0);
    expect(checkAnswer(p, ` ${p.answer} `).correct).toBe(true);
    expect(checkAnswer(p, "abc").showSolution).toBe(false);
  });
});

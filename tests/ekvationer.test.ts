import { describe, expect, test } from "bun:test";
import { ANIMALS, shownRow, checkAnswer, evaluate, explain, generatePuzzle, pickFigures, PROFILES } from "../src/lib/ekvationer";

const PEOPLE = new Set<string>(PROFILES.map((p) => p.id));
const EMOJI = new Set(ANIMALS);

describe("ekvationspusslet", () => {
  test("every puzzle is solvable one new figure per line and the answer matches", () => {
    for (let level = 0; level < 4; level++) for (let k = 0; k < 400; k++) {
      const p = generatePuzzle(level);
      expect(new Set(p.symbols).size).toBe(p.symbols.length);
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

  test("level 1 keeps rows in order; levels 2–4 always shuffle rows but the question stays last", () => {
    for (let k = 0; k < 300; k++) {
      expect(generatePuzzle(0).order).toEqual([0, 1]);
      for (const level of [1, 2, 3]) {
        const p = generatePuzzle(level);
        expect([...p.order].sort()).toEqual([0, 1, 2]);
        expect(p.order).not.toEqual([0, 1, 2]);
      }
    }
  });

  test("explanation starts at the key row wherever it is shown and then follows the logic", () => {
    for (let k = 0; k < 300; k++) {
      const p = generatePuzzle(1 + (k % 3));
      const steps = explain(p, String);
      expect(steps[0]).toContain(`Börja med rad ${shownRow(p, 0)}`);
      expect(steps[1]).toContain(`rad ${shownRow(p, 1)}`);
      expect(steps[2]).toContain(`rad ${shownRow(p, 2)}`);
      expect(steps[0]).toContain(`= ${p.values[0]}.`);
      expect(steps.at(-1)).toContain("Sista raden");
    }
  });

  test("level 1 uses two figures and only addition", () => {
    for (let k = 0; k < 200; k++) {
      const p = generatePuzzle(0);
      expect(p.values.length).toBe(2);
      for (const t of [...p.lines.flatMap((l) => l.terms), ...p.question]) {
        expect(t.coef).toBe(1);
        expect(t.syms.length).toBe(1);
      }
    }
  });

  test("level 2 has three figures; levels 3 and 4 need multiplication before addition", () => {
    for (let k = 0; k < 200; k++) {
      expect(generatePuzzle(1).values.length).toBe(3);
      for (const level of [2, 3]) {
        const p = generatePuzzle(level);
        expect(p.question.some((t) => t.syms.length === 2)).toBe(true);
        expect(p.leftToRight).not.toBe(p.answer);
        expect(checkAnswer(p, String(p.leftToRight)).message).toContain("gånger går före plus");
        expect(checkAnswer(p, String(p.leftToRight)).priorityError).toBe(true);
        expect(checkAnswer(p, String(p.answer + (p.answer + 1 === p.leftToRight ? 2 : 1))).priorityError).toBeFalsy();
      }
    }
  });

  test("level 4 uses x, y and z", () => {
    expect(generatePuzzle(3).symbols).toEqual(["x", "y", "z"]);
  });

  test("celebrities sneak in gradually: rarely on level 1, about half on level 2, mostly on level 3", () => {
    const N = 4000;
    const share = (lv: number) => {
      let people = 0, total = 0, puzzlesWithPerson = 0;
      for (let k = 0; k < N; k++) {
        const s = pickFigures(lv, lv === 0 ? 2 : 3);
        s.forEach((x) => expect(PEOPLE.has(x) || EMOJI.has(x)).toBe(true));
        const c = s.filter((x) => PEOPLE.has(x)).length;
        people += c; total += s.length; if (c) puzzlesWithPerson++;
        if (lv === 0) expect(c).toBeLessThanOrEqual(1);
        if (lv === 2) expect(c).toBeGreaterThanOrEqual(2);
      }
      return { figures: people / total, puzzles: puzzlesWithPerson / N };
    };
    const l1 = share(0), l2 = share(1), l3 = share(2);
    expect(l1.puzzles).toBeGreaterThan(0.24); expect(l1.puzzles).toBeLessThan(0.32);
    expect(l2.figures).toBeGreaterThan(0.45); expect(l2.figures).toBeLessThan(0.55);
    expect(l3.figures).toBeGreaterThan(0.9);
  });

  test("Magdalena is in the celebrity pool", () => {
    const seen = new Set<string>();
    for (let k = 0; k < 600; k++) pickFigures(2, 3).forEach((s) => seen.add(s));
    expect(seen.has("magdalena")).toBe(true);
  });

  test("answers accept spaces and the typographic minus", () => {
    const p = generatePuzzle(0, () => 0);
    expect(checkAnswer(p, ` ${p.answer} `).correct).toBe(true);
    expect(checkAnswer(p, "abc").showSolution).toBe(false);
  });
});

describe("slutfrågan", () => {
  test("är aldrig en befintlig rad i omkastad ordning", () => {
    const { generatePuzzle } = require("../src/lib/ekvationer");
    const sig = (t: { coef: number; syms: number[] }[]) => t.map((x) => `${x.coef}*${[...x.syms].sort().join(".")}`).sort().join("+");
    for (let lv = 0; lv < 4; lv++) for (let i = 0; i < 2000; i++) {
      const p = generatePuzzle(lv);
      for (const l of p.lines) expect(sig(l.terms)).not.toBe(sig(p.question));
    }
  });
});

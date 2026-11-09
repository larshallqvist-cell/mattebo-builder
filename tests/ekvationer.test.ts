import { describe, expect, test } from "bun:test";
import { ANIMALS, shownRow, checkAnswer, evaluate, explain, exprText, generatePuzzle, pickFigures, PROFILES, type Term } from "../src/lib/ekvationer";

const symsOf = (terms: Term[]): number[] => terms.flatMap((t) => [...t.syms, ...(t.inner ? symsOf(t.inner) : [])]);

const PEOPLE = new Set<string>(PROFILES.map((p) => p.id));
const EMOJI = new Set(ANIMALS);

describe("ekvationspusslet", () => {
  test("every puzzle is solvable one new figure per line and the answer matches", () => {
    for (let level = 0; level < 5; level++) for (let k = 0; k < 400; k++) {
      const p = generatePuzzle(level);
      expect(new Set(p.symbols).size).toBe(p.symbols.length);
      p.lines.forEach((line, i) => {
        expect(evaluate(line.terms, p.values)).toBe(line.result);
        expect(Number.isInteger(line.result)).toBe(true);
        const syms = new Set(symsOf(line.terms));
        expect(syms.has(i)).toBe(true);
        expect([...syms].every((s) => s <= i)).toBe(true);
      });
      expect(new Set(symsOf(p.lines[0].terms)).size).toBe(1);
      expect(Number.isInteger(p.answer)).toBe(true);
      expect(evaluate(p.question, p.values)).toBe(p.answer);
      expect(explain(p, String).at(-1)).toContain(`= ${p.answer}.`);
      expect(checkAnswer(p, String(p.answer)).correct).toBe(true);
    }
  });

  test("level 1 keeps rows in order; levels 2–5 always shuffle rows but the question stays last", () => {
    for (let k = 0; k < 300; k++) {
      expect(generatePuzzle(0).order).toEqual([0, 1]);
      for (const level of [1, 2, 3, 4]) {
        const p = generatePuzzle(level);
        expect([...p.order].sort()).toEqual([0, 1, 2]);
        expect(p.order).not.toEqual([0, 1, 2]);
      }
    }
  });

  test("explanation starts at the key row wherever it is shown and then follows the logic", () => {
    for (let k = 0; k < 300; k++) {
      const p = generatePuzzle(1 + (k % 4));
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

  test("level 5 uses x, y, z with fractions and parentheses in every puzzle", () => {
    let fractions = 0, groups = 0;
    for (let k = 0; k < 1000; k++) {
      const p = generatePuzzle(4);
      expect(p.symbols).toEqual(["x", "y", "z"]);
      const all = [...p.lines.flatMap((l) => l.terms), ...p.question];
      expect(all.some((t) => t.inner || t.div)).toBe(true);
      if (all.some((t) => t.div)) fractions++;
      if (all.some((t) => t.inner)) groups++;
      // Slutraden kräver alltid en parentes med två variabler.
      const group = p.question.find((t) => t.inner);
      expect(group).toBeDefined();
      expect(symsOf(group!.inner!).length).toBe(2);
    }
    expect(fractions).toBeGreaterThan(700);
    expect(groups).toBe(1000);
  });

  test("level 5: ignoring the parentheses is caught as a parenthesis error, not a priority error", () => {
    let caught = 0;
    for (let k = 0; k < 600; k++) {
      const p = generatePuzzle(4);
      expect(p.leftToRight).not.toBe(p.answer);
      if (!Number.isInteger(p.leftToRight)) continue;
      const r = checkAnswer(p, String(p.leftToRight));
      expect(r.correct).toBe(false);
      expect(r.parenError).toBe(true);
      expect(r.priorityError).toBeFalsy();
      expect(r.message).toContain("parentesen");
      caught++;
    }
    expect(caught).toBeGreaterThan(200);
  });

  test("level 5 explanation removes the fraction or parenthesis and computes the parenthesis first", () => {
    const p = {
      level: 4, symbols: ["x", "y", "z"], values: [6, 4, 10], order: [2, 0, 1],
      lines: [
        { terms: [{ coef: 1, syms: [0], div: 3 }], result: 2 },
        { terms: [{ coef: 2, syms: [], inner: [{ coef: 1, syms: [0] }, { coef: 1, syms: [1] }] }], result: 20 },
        { terms: [{ coef: 1, syms: [], inner: [{ coef: 1, syms: [1] }, { coef: 1, syms: [2] }], div: 7 }], result: 2 },
      ],
      question: [{ coef: 1, syms: [0], inner: [{ coef: 1, syms: [1] }, { coef: 1, syms: [2] }] }],
      answer: 84, leftToRight: 34,
    };
    const name = (s: number) => p.symbols[s];
    expect(exprText(p.lines[1].terms, name)).toBe("2(x + y)");
    expect(exprText(p.lines[2].terms, name)).toBe("(y + z)/7");
    expect(exprText(p.question, name)).toBe("x(y + z)");
    const steps = explain(p, name);
    expect(steps[0]).toContain("Börja med rad 2");
    expect(steps[0]).toContain("x = 2 · 3 = 6.");
    expect(steps[1]).toContain("rad 3");
    expect(steps[1]).toContain("Dela båda sidor med 2: x + y = 20 / 2 = 10");
    expect(steps[1]).toContain("y = 10 − 6 = 4.");
    expect(steps[2]).toContain("multiplicera båda sidor med 7: y + z = 2 · 7 = 14");
    expect(steps[2]).toContain("z = 14 − 4 = 10.");
    expect(steps[3]).toBe("Sista raden: 6 · (4 + 10). Parentesen först: 4 + 10 = 14. Sedan gånger: 6 · 14 = 84.");
    expect(checkAnswer(p, "34").parenError).toBe(true);
    expect(checkAnswer(p, "84").correct).toBe(true);
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
    for (let lv = 0; lv < 5; lv++) for (let i = 0; i < 2000; i++) {
      const p = generatePuzzle(lv);
      for (const l of p.lines) expect(sig(l.terms)).not.toBe(sig(p.question));
    }
  });
});

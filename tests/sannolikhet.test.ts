import { describe, expect, test } from "bun:test";
import {
  checkAnswer, isUnlocked, LEVELS, makeRound, mergeBest, pctOk, sannolikhetAvailable, starsFor, type Frac, type Task,
} from "../src/lib/sannolikhet";

const frac = (n: number, d: number): Task => ({ scene: { kind: "die" }, question: "", format: "frac", answer: { n, d }, hint: "", steps: [] });

describe("Sannolikhetslabbet – rättning", () => {
  test("oförkortat bråk godkänns men markeras som oförkortat", () => {
    expect(checkAnswer(frac(13, 52), { n: "1", d: "4" })).toEqual({ ok: true, simplified: true });
    expect(checkAnswer(frac(13, 52), { n: "13", d: "52" })).toEqual({ ok: true, simplified: false });
    expect(checkAnswer(frac(13, 52), { n: "1", d: "13" })?.ok).toBe(false);
    expect(checkAnswer(frac(1, 4), { n: "1", d: "" })).toBeNull();
  });
  test("procent med decimalkomma: 3/8 = 37,5 %", () => {
    const t: Task = { ...frac(3, 8), format: "pct" };
    expect(checkAnswer(t, { v: "37,5" })?.ok).toBe(true);
    expect(checkAnswer(t, { v: "37.5 %" })?.ok).toBe(true);
    expect(checkAnswer(t, { v: "38" })?.ok).toBe(false);
  });
  test("procentuppgifter går att skriva med högst en decimal", () => {
    expect(pctOk({ n: 1, d: 8 })).toBe(true);
    expect(pctOk({ n: 1, d: 3 })).toBe(false);
  });
});

describe("Sannolikhetslabbet – nivåer", () => {
  test("4 världar × 6 nivåer", () => {
    expect(LEVELS.length).toBe(24);
    expect(new Set(LEVELS.map((l) => l.world)).size).toBe(4);
  });
  test("varje nivå ger fem giltiga uppgifter med rätt svar", () => {
    for (const level of LEVELS) for (let r = 0; r < 40; r++) {
      const round = makeRound(level);
      expect(round.length).toBe(5);
      for (const t of round) {
        if (t.format === "int") {
          expect(Number.isInteger(t.answer as number) && (t.answer as number) > 0).toBe(true);
          expect(checkAnswer(t, { v: String(t.answer) })?.ok).toBe(true);
        } else {
          const f = t.answer as Frac;
          expect(f.d > 0 && f.n > 0 && f.n <= f.d).toBe(true);
          if (t.format === "pct") expect(pctOk(f)).toBe(true);
          const input = t.format === "pct" ? { v: String((100 * f.n) / f.d).replace(".", ",") } : { n: String(f.n), d: String(f.d) };
          expect(checkAnswer(t, input)?.ok).toBe(true);
        }
        if (t.scene.kind === "wheel") expect(t.scene.slices.every((s) => s.size > 0)).toBe(true);
      }
    }
  });
  test("kortleken: ess = 4/52, tre mynt exakt två kronor = 3/8", () => {
    const ranks = LEVELS.find((l) => l.id === "3-2")!;
    for (let i = 0; i < 30; i++) {
      const t = ranks.gen();
      expect(t.answer).toEqual({ n: 4, d: 52 });
    }
    const three = LEVELS.find((l) => l.id === "4-4")!;
    for (let i = 0; i < 60; i++) {
      const t = three.gen();
      if (t.question.includes("exakt två kronor")) expect(t.answer).toEqual({ n: 3, d: 8 });
      if (t.question.includes("tre kronor")) expect(t.answer).toEqual({ n: 1, d: 8 });
    }
  });
  test("kung eller hjärter räknar hjärter kung en gång (16/52)", () => {
    const lvl = LEVELS.find((l) => l.id === "3-5")!;
    for (let i = 0; i < 200; i++) {
      const t = lvl.gen();
      if (/^Du drar ett kort\. Hur stor är chansen att det är en kung eller ett/.test(t.question)) expect(t.answer).toEqual({ n: 16, d: 52 });
    }
  });
});

describe("Sannolikhetslabbet – stjärnor och upplåsning", () => {
  test("5 rätt = 3 stjärnor, 4 = 2, 3 = 1, 2 = ingen", () => {
    expect([5, 4, 3, 2].map(starsFor)).toEqual([3, 2, 1, 0]);
  });
  test("första nivån i varje värld är öppen, nästa kräver den förra", () => {
    expect(isUnlocked("3-1", {})).toBe(true);
    expect(isUnlocked("3-2", {})).toBe(false);
    expect(isUnlocked("3-2", { "3-1": { stars: 1, best_correct: 3 } })).toBe(true);
    expect(isUnlocked("3-2", {}, true)).toBe(true);
  });
  test("bara bättre resultat sparas, och aldrig noll stjärnor", () => {
    expect(mergeBest(undefined, 0, 2)).toBeNull();
    expect(mergeBest({ stars: 3, best_correct: 5 }, 2, 4)).toBeNull();
    expect(mergeBest({ stars: 1, best_correct: 3 }, 2, 4)).toEqual({ stars: 2, best_correct: 4 });
  });
  test("spelmatrisen styr eleverna, standard öppet i alla klasser", () => {
    expect(sannolikhetAvailable(7, false, [])).toBe(true);
    const off = [1, 2, 3, 4, 5].map((chapter) => ({ grade: 7, chapter, game_key: "sannolikhet", enabled: false }));
    expect(sannolikhetAvailable(7, false, off)).toBe(false);
    expect(sannolikhetAvailable(7, true, off)).toBe(true);
  });
});

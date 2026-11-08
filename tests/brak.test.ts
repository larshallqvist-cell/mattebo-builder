import { describe, expect, test } from "bun:test";
import { BANOR, checkBrak, equal, generateBrak, parseAnswer, scoreAnswer, TIERS, type BrakTask } from "../src/lib/brak";

const t = (over: Partial<BrakTask>): BrakTask => ({ bana: "addsub", kind: "add", question: "", tokens: [], answer: { n: 3, d: 4 }, expect: { kind: "any" }, pictures: [], ...over });

describe("parseAnswer", () => {
  test("bråk, blandad form, heltal och minus", () => {
    expect(parseAnswer("3/4")?.value).toEqual({ n: 3, d: 4 });
    expect(parseAnswer("1 3/4")?.value).toEqual({ n: 7, d: 4 });
    expect(parseAnswer("−1 1/2")?.value).toEqual({ n: -3, d: 2 });
    expect(parseAnswer("5")?.form).toBe("integer");
    expect(parseAnswer("3/0")).toBeNull();
    expect(parseAnswer("abc")).toBeNull();
  });
});

describe("checkBrak", () => {
  test("oförkortat rätt värde räknas som rätt men markeras", () => {
    const r = checkBrak(t({}), "6/8")!;
    expect(r.correct).toBe(true);
    expect(r.unsimplified).toBe(true);
    expect(checkBrak(t({}), "3/4")!.unsimplified).toBe(false);
  });
  test("fel värde är fel", () => expect(checkBrak(t({}), "2/4")!.correct).toBe(false));
  test("blandad form krävs när uppgiften ber om det", () => {
    const task = t({ answer: { n: 7, d: 4 }, expect: { kind: "mixed" } });
    expect(checkBrak(task, "7/4")!.correct).toBe(false);
    expect(checkBrak(task, "1 3/4")!.correct).toBe(true);
  });
  test("bråkform krävs när uppgiften ber om det", () => {
    const task = t({ answer: { n: 7, d: 4 }, expect: { kind: "improper" } });
    expect(checkBrak(task, "1 3/4")!.correct).toBe(false);
    expect(checkBrak(task, "7/4")!.correct).toBe(true);
  });
  test("förlängning kräver given nämnare, förkortning kräver enklaste form", () => {
    expect(checkBrak(t({ answer: { n: 8, d: 12 }, expect: { kind: "denominator", d: 12 } }), "2/3")!.correct).toBe(false);
    expect(checkBrak(t({ answer: { n: 8, d: 12 }, expect: { kind: "denominator", d: 12 } }), "8/12")!.correct).toBe(true);
    expect(checkBrak(t({ answer: { n: 1, d: 2 }, expect: { kind: "lowest" } }), "2/4")!.correct).toBe(false);
  });
  test("MGN kräver heltal", () => {
    expect(checkBrak(t({ answer: { n: 12, d: 1 }, expect: { kind: "integer" } }), "12")!.correct).toBe(true);
    expect(checkBrak(t({ answer: { n: 12, d: 1 }, expect: { kind: "integer" } }), "24/2")!.correct).toBe(false);
  });
});

describe("scoreAnswer", () => {
  test("steg 1: oförkortat ger full poäng", () => expect(scoreAnswer(0, true, 0, false)).toEqual({ points: 1, warning: false }));
  test("steg 2–3: fem varningar, sedan halv poäng", () => {
    expect(scoreAnswer(1, true, 4, false)).toEqual({ points: 1, warning: true });
    expect(scoreAnswer(2, true, 5, false)).toEqual({ points: 0.5, warning: false });
  });
  test("steg 4+: oförkortat ger halv poäng", () => expect(scoreAnswer(3, true, 0, false).points).toBe(0.5));
  test("miniräknare halverar på steg 1–3 men inte från steg 4", () => {
    expect(scoreAnswer(2, false, 0, true).points).toBe(0.5);
    expect(scoreAnswer(3, false, 0, true).points).toBe(1);
  });
});

describe("generateBrak", () => {
  test("alla banor och steg ger uppgifter där facit godkänns", () => {
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const b of BANOR) for (let tier = 0; tier < TIERS; tier++) for (let i = 0; i < 40; i++) {
      const task = generateBrak(b, tier, rnd);
      expect(task.bana).toBe(b);
      expect(Number.isFinite(task.answer.n / task.answer.d)).toBe(true);
      const e = task.expect;
      const a = task.answer;
      let raw: string;
      if (e.kind === "denominator") raw = `${a.n * (e.d / a.d)}/${e.d}`;
      else { const g = (x: number, y: number): number => (y ? g(y, x % y) : Math.abs(x)); const k = g(a.n, a.d); const n = a.n / k, d = a.d / k;
        if (d === 1) raw = `${n}`; else if (e.kind === "mixed" && Math.abs(n) > d) raw = `${n < 0 ? "-" : ""}${Math.floor(Math.abs(n) / d)} ${Math.abs(n) % d}/${d}`; else raw = `${n}/${d}`; }
      const r = checkBrak(task, raw)!;
      expect(r.correct).toBe(true);
      expect(equal(parseAnswer(raw)!.value, a)).toBe(true);
    }
  });
});

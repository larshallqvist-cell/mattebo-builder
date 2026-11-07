import { describe, expect, test } from "bun:test";
import {
  advance, CALCULATOR_FROM_STEP, calculatorAllowed, checkFactor, checkFactorDrill, checkNewValue, checkTriangle, DRILL_LEVELS, DRILL_START, FACTOR_LEVELS, factorAnswer,
  generateChange, generateDrill, generateFactorDrill, generateTriangle, type FactorTask,
  parseNumber, tierOf, triangleAnswer, type TriangleTask,
} from "../src/lib/procent";

describe("mängdträning", () => {
  test("rätt svar höjer sviten, fel nollställer den", () => {
    let p = DRILL_START;
    for (let i = 0; i < 4; i++) p = advance(p, true);
    expect(p.streak).toBe(4);
    p = advance(p, false);
    expect(p.streak).toBe(0);
  });
  test("ett nytt steg efter 6 rätt, ett fel backar 2, aldrig under 0, högst steg 6", () => {
    let p = DRILL_START;
    for (let i = 0; i < 5; i++) p = advance(p, true);
    expect(tierOf(p.xp)).toBe(0);
    p = advance(p, true);
    expect(tierOf(p.xp)).toBe(1);
    p = advance(p, false);
    expect(p.xp).toBe(4);
    expect(tierOf(p.xp)).toBe(0);
    expect(advance(DRILL_START, false).xp).toBe(0);
    for (let i = 0; i < 200; i++) p = advance(p, true);
    expect(tierOf(p.xp)).toBe(5);
    expect(tierOf(advance(p, false).xp)).toBe(5);
  });
  test("vald ruta styr vad som söks; MIX blandar alla tre", () => {
    for (const k of ["andel", "delen", "hela"] as const) for (let i = 0; i < 50; i++) expect(generateDrill(k, 2).kind).toBe(k);
    const kinds = new Set(Array.from({ length: 200 }, () => generateDrill("mix", 0).kind));
    expect(kinds.size).toBe(3);
  });
  test("steg 1 bara 10 % och 50 % med heltal; steg 1–4 alltid heltal; alltid Delen = Andelen · Det hela", () => {
    for (let tier = 0; tier < DRILL_LEVELS.length; tier++) for (let i = 0; i < 300; i++) {
      const t = generateDrill("mix", tier);
      expect(t.part).toBeCloseTo((t.rate * t.whole) / 100, 6);
      expect(checkTriangle(t, String(triangleAnswer(t)).replace(".", ",")).correct).toBe(true);
      if (tier === 0) expect([10, 50]).toContain(t.rate);
      if (tier <= 3) expect(Number.isInteger(t.part)).toBe(true);
    }
  });
  test("samma uppgift kommer inte två gånger i rad", () => {
    let prev = generateDrill("delen", 0);
    for (let i = 0; i < 200; i++) {
      const t = generateDrill("delen", 0, Math.random, prev);
      expect(t.rate === prev.rate && t.whole === prev.whole).toBe(false);
      prev = t;
    }
  });
});

const tri = (kind: TriangleTask["kind"]): TriangleTask => ({ kind, rate: 25, part: 20, whole: 80, text: "", question: "", unit: "st" });

describe("procenttriangeln", () => {
  test("genererade uppgifter håller Delen = Andelen · Det hela med heltal", () => {
    for (let i = 0; i < 300; i++) {
      const t = generateTriangle();
      expect(t.part).toBe((t.rate * t.whole) / 100);
      expect(Number.isInteger(t.part)).toBe(true);
    }
  });
  test("andelen svaras i procent; 0,25 ger ledtråd men räknas inte rätt", () => {
    expect(checkTriangle(tri("andel"), "25 %").correct).toBe(true);
    expect(checkTriangle(tri("andel"), "0,25").correct).toBe(false);
  });
  test("delen och det hela", () => {
    expect(checkTriangle(tri("delen"), "20").correct).toBe(true);
    expect(checkTriangle(tri("hela"), "80").correct).toBe(true);
    expect(checkTriangle(tri("hela"), "5").correct).toBe(false);
    expect(triangleAnswer(tri("hela"))).toBe(80);
  });
});

describe("förändringsfaktor", () => {
  const up = { original: 800, percent: 25, factor: 1.25, newValue: 1000, text: "", unit: "kr" };
  const down = { original: 800, percent: -25, factor: 0.75, newValue: 600, text: "", unit: "kr" };
  test("ökning 25 % ger faktor 1,25 och 1000", () => {
    expect(checkFactor(up, "1,25").correct).toBe(true);
    expect(checkFactor(up, "0,25").correct).toBe(false);
    expect(checkFactor(up, "125").correct).toBe(false);
    expect(checkNewValue(up, "1 000 kr").correct).toBe(true);
  });
  test("minskning 25 % ger faktor 0,75 och 600", () => {
    expect(checkFactor(down, "0.75").correct).toBe(true);
    expect(checkFactor(down, "1,25").correct).toBe(false);
    expect(checkNewValue(down, "600").correct).toBe(true);
  });
  test("nivå 1 ger bara ökningar, nivå 2 bara minskningar", () => {
    for (let i = 0; i < 200; i++) {
      const a = generateChange(0), b = generateChange(1);
      expect(a.percent).toBeGreaterThan(0);
      expect(b.percent).toBeLessThan(0);
      expect(a.newValue).toBeCloseTo(a.original * a.factor, 6);
      expect(b.newValue).toBeCloseTo(b.original * b.factor, 6);
    }
  });
  test("parseNumber tål komma, procent och mellanslag", () => {
    expect(parseNumber("12,5 %")).toBe(12.5);
    expect(parseNumber("1 200")).toBe(1200);
    expect(parseNumber("abc")).toBeNull();
  });
});

describe("mängdträning med förändringsfaktor", () => {
  const ft = (kind: FactorTask["kind"], percent: number, original = 800): FactorTask => {
    const factor = Math.round((1 + percent / 100) * 1e6) / 1e6;
    return { kind, percent, factor, original, newValue: Math.round(original * factor * 1e6) / 1e6, text: "", unit: "", question: "" };
  };
  test("steg 1 bara ökningar, steg 2 bara minskningar, båda med 10, 20, 25 eller 50 %", () => {
    for (let i = 0; i < 300; i++) {
      const a = generateFactorDrill("mix", 0), b = generateFactorDrill("mix", 1);
      expect([10, 20, 25, 50]).toContain(a.percent);
      expect([-10, -20, -25, -50]).toContain(b.percent);
    }
  });
  test("vald träning styr uppgiftstypen; MIX blandar alla tre", () => {
    for (const k of ["faktor", "nytt", "procent"] as const) for (let i = 0; i < 50; i++) expect(generateFactorDrill(k, 3).kind).toBe(k);
    expect(new Set(Array.from({ length: 200 }, () => generateFactorDrill("mix", 2).kind)).size).toBe(3);
  });
  test("alla steg: nya värdet = ursprung · faktor, rätt svar godkänns, steg 1–4 ger heltal", () => {
    for (let tier = 0; tier < FACTOR_LEVELS.length; tier++) for (let i = 0; i < 300; i++) {
      const t = generateFactorDrill("mix", tier);
      expect(t.newValue).toBeCloseTo(t.original * t.factor, 6);
      expect(t.newValue).toBeGreaterThan(0);
      expect(checkFactorDrill(t, String(factorAnswer(t)).replace(".", ",")).correct).toBe(true);
      if (tier <= 3) expect(Number.isInteger(t.newValue)).toBe(true);
    }
  });
  test("ökning 20 % ger faktor 1,2; minskning 25 % ger 0,75; 125 eller 0,25 är fel", () => {
    expect(checkFactorDrill(ft("faktor", 20), "1,2").correct).toBe(true);
    expect(checkFactorDrill(ft("faktor", 20), "1.20").correct).toBe(true);
    expect(checkFactorDrill(ft("faktor", 20), "120").correct).toBe(false);
    expect(checkFactorDrill(ft("faktor", -25), "0,75").correct).toBe(true);
    expect(checkFactorDrill(ft("faktor", -25), "0,25").correct).toBe(false);
    expect(checkFactorDrill(ft("faktor", -25), "1,25").correct).toBe(false);
  });
  test("faktorer jämförs exakt: minskning 2,5 % är 0,975, inte 0,97", () => {
    expect(checkFactorDrill(ft("faktor", -2.5), "0,975").correct).toBe(true);
    expect(checkFactorDrill(ft("faktor", -2.5), "0,97").correct).toBe(false);
  });
  test("nya värdet: 800 ökar 25 % blir 1000; förändringen 200 räknas inte", () => {
    expect(checkFactorDrill(ft("nytt", 25), "1 000").correct).toBe(true);
    expect(checkFactorDrill(ft("nytt", 25), "200").correct).toBe(false);
    expect(checkFactorDrill(ft("nytt", -25), "600").correct).toBe(true);
  });
  test("förändringen: faktor 0,85 betyder 15 % minskning; 85 räknas inte", () => {
    expect(checkFactorDrill(ft("procent", -15), "15").correct).toBe(true);
    expect(checkFactorDrill(ft("procent", -15), "85").correct).toBe(false);
    expect(checkFactorDrill(ft("procent", 150), "150").correct).toBe(true);
  });
  test("samma uppgift kommer inte två gånger i rad", () => {
    let prev = generateFactorDrill("faktor", 0);
    for (let i = 0; i < 200; i++) {
      const t = generateFactorDrill("faktor", 0, Math.random, prev);
      expect(t.percent).not.toBe(prev.percent);
      prev = t;
    }
  });
});

describe("miniräknare i mängdträningen", () => {
  test("låst i steg 1–3, öppet från steg 4", () => {
    expect(CALCULATOR_FROM_STEP).toBe(4);
    expect(calculatorAllowed(0)).toBe(false);
    expect(calculatorAllowed(1)).toBe(false);
    expect(calculatorAllowed(2)).toBe(false);
    expect(calculatorAllowed(3)).toBe(true);
    expect(calculatorAllowed(DRILL_TIERS - 1)).toBe(true);
  });
});

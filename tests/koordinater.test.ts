import { describe, expect, test } from "bun:test";
import { checkAnswer, fmtPoint, generateTask, KOORD_TIERS, parseCoord, snapPoint, type KoordTask } from "../src/lib/koordinater";

const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const many = (mode: "las" | "mix", tier: number, n = 400) => {
  const rnd = seeded(tier + 7); let prev: KoordTask | undefined; const out: KoordTask[] = [];
  for (let i = 0; i < n; i++) { prev = generateTask(mode, tier, rnd, prev); out.push(prev); }
  return out;
};

describe("Koordinater – steg", () => {
  test("steg 1 håller sig i första kvadranten med heltal 1–5", () => {
    for (const t of many("las", 0)) {
      expect(t.point.x).toBeGreaterThanOrEqual(1); expect(t.point.x).toBeLessThanOrEqual(5);
      expect(t.point.y).toBeGreaterThanOrEqual(1); expect(t.point.y).toBeLessThanOrEqual(5);
      expect(Number.isInteger(t.point.x) && Number.isInteger(t.point.y)).toBe(true);
    }
  });

  test("steg 3 använder alla fyra kvadranter", () => {
    const q = new Set(many("las", 2).map((t) => `${Math.sign(t.point.x)}${Math.sign(t.point.y)}`));
    expect(q).toEqual(new Set(["11", "1-1", "-11", "-1-1"]));
  });

  test("steg 4 har ibland punkter på axlarna men aldrig origo", () => {
    const ts = many("las", 3);
    expect(ts.some((t) => t.point.x === 0 || t.point.y === 0)).toBe(true);
    expect(ts.some((t) => t.point.x === 0 && t.point.y === 0)).toBe(false);
  });

  test("steg 5–6 har alltid minst en halv koordinat, t.ex. 1,5", () => {
    for (const tier of [4, 5]) for (const t of many("las", tier)) {
      expect(Number.isInteger(t.point.x) && Number.isInteger(t.point.y)).toBe(false);
      expect(Number.isInteger(t.point.x * 2) && Number.isInteger(t.point.y * 2)).toBe(true);
      const s = KOORD_TIERS[tier];
      expect(t.point.x).toBeGreaterThanOrEqual(s.min); expect(t.point.x).toBeLessThanOrEqual(s.max);
    }
  });

  test("halva steg kommer först på steg 5", () => {
    for (const tier of [0, 1, 2, 3]) for (const t of many("las", tier))
      expect(Number.isInteger(t.point.x) && Number.isInteger(t.point.y)).toBe(true);
  });

  test("samma punkt kommer aldrig två gånger i rad", () => {
    const ts = many("mix", 0);
    for (let i = 1; i < ts.length; i++) expect(fmtPoint(ts[i].point)).not.toBe(fmtPoint(ts[i - 1].point));
  });

  test("Läs av ger bara avläsning, MIX blandar avläsning och utsättning", () => {
    expect(many("las", 2).every((t) => t.kind === "read")).toBe(true);
    const kinds = new Set(many("mix", 2).map((t) => t.kind));
    expect(kinds).toEqual(new Set(["read", "place"]));
  });
});

describe("Koordinater – rättning", () => {
  const t: KoordTask = { kind: "read", point: { x: 3, y: -2 }, label: "A", tier: 2 };
  test("rätt svar godkänns", () => expect(checkAnswer(t, { x: 3, y: -2 }).correct).toBe(true));
  test("bytt plats på x och y känns igen", () => expect(checkAnswer(t, { x: -2, y: 3 }).error).toBe("swapped"));
  test("fel tecken känns igen", () => expect(checkAnswer(t, { x: 3, y: 2 }).error).toBe("sign"));
  test("annat fel", () => expect(checkAnswer(t, { x: 4, y: -2 })).toMatchObject({ correct: false, error: "other" }));
  test("1,5 och 1.5 tolkas lika, minus i olika former", () => {
    expect(parseCoord("1,5")).toBe(1.5); expect(parseCoord("1.5")).toBe(1.5);
    expect(parseCoord("−3")).toBe(-3); expect(parseCoord("- 3")).toBe(-3); expect(parseCoord("tre")).toBeNull();
  });
  test("decimaler skrivs med semikolon, heltal med komma", () => {
    expect(fmtPoint({ x: 1.5, y: 2 })).toBe("(1,5; 2)");
    expect(fmtPoint({ x: -3, y: 2 })).toBe("(−3, 2)");
  });
  test("klick fäster på hela steg, och på halva steg från steg 5", () => {
    expect(snapPoint({ x: 2.4, y: -1.6 }, 2)).toEqual({ x: 2, y: -2 });
    expect(snapPoint({ x: 1.4, y: 3.8 }, 4)).toEqual({ x: 1.5, y: 4 });
    expect(snapPoint({ x: 9, y: -9 }, 2)).toEqual({ x: 6, y: -6 });
  });
});

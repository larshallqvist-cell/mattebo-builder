import { describe, expect, test } from "bun:test";
import { checkFactor, checkNewValue, checkTriangle, generateChange, generateTriangle, parseNumber, triangleAnswer, type TriangleTask } from "../src/lib/procent";

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

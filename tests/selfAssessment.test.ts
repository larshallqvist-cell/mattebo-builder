import { describe, expect, test } from "bun:test";
import { DEFAULT_QUESTIONS, SCALE, defaultQuestions, parseQuestions, resolveQuestions, summarize } from "../src/lib/selfAssessment";

describe("självskattning", () => {
  test("skalan har tre nivåer med lärarens formuleringar", () => {
    expect(SCALE.map((s) => s.value)).toEqual([1, 2, 3]);
    expect(SCALE.map((s) => s.label)).toEqual(["Nja, kanske med lite hjälp", "Ja, jag är ganska säker", "Jag känner mig helt säker"]);
  });

  test("kapitel 1 och 2 har frågor för alla fyra årskurser", () => {
    for (const g of [6, 7, 8, 9]) for (const c of [1, 2]) expect(DEFAULT_QUESTIONS[`${g}-${c}`]?.length).toBeGreaterThan(0);
    expect(defaultQuestions(6, 1, 5)).toHaveLength(5); // 1.6 Stora tal
    expect(defaultQuestions(7, 3, 0)).toEqual([]);
  });

  test("lärarens frågor ersätter standard, tom lista faller tillbaka", () => {
    expect(resolveQuestions(["A", " "], ["X"])).toEqual(["A"]);
    expect(resolveQuestions([], ["X"])).toEqual(["X"]);
    expect(parseQuestions("- A\n\n• B\n")).toEqual(["A", "B"]);
  });

  test("summering räknar tre nivåer, matchar på frågetext och hoppar över gamla värden", () => {
    const s = summarize(["A", "B"], [
      { questions: ["A", "B"], ratings: [3, 0] },
      { questions: ["B"], ratings: [1] },
      { questions: ["A"], ratings: [4] },
    ]);
    expect(s[0].counts).toEqual([0, 0, 1]);
    expect(s[0].answered).toBe(1);
    expect(s[1].counts).toEqual([1, 0, 0]);
    expect(s[1].answered).toBe(1);
  });
});

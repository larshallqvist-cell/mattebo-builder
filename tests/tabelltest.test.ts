import { test, expect } from "bun:test";
import {
  generateQuestions, isPassed, parseSpokenNumber,
  QUESTION_COUNT, TABLE_MIN, TABLE_MAX, FACTOR_MAX, PASS_SCORE, PASS_AVG_MS,
} from "../src/lib/tabelltest";

test("20 unika uppgifter ur tabellerna 2-9 med faktorer 1-10", () => {
  const qs = generateQuestions();
  expect(qs.length).toBe(QUESTION_COUNT);
  const keys = new Set(qs.map((q) => `${q.a}x${q.b}`));
  expect(keys.size).toBe(QUESTION_COUNT);
  for (const q of qs) {
    expect(q.a).toBeGreaterThanOrEqual(TABLE_MIN);
    expect(q.a).toBeLessThanOrEqual(TABLE_MAX);
    expect(q.b).toBeGreaterThanOrEqual(1);
    expect(q.b).toBeLessThanOrEqual(FACTOR_MAX);
    expect(q.answer).toBe(q.a * q.b);
  }
});

test("godkänt kräver minst 18 av 20 rätt", () => {
  expect(isPassed(PASS_SCORE, 1500)).toBe(true);
  expect(isPassed(PASS_SCORE - 1, 1500)).toBe(false);
});

test("godkänt kräver snittid högst 2,0 sekunder", () => {
  expect(isPassed(20, PASS_AVG_MS)).toBe(true);
  expect(isPassed(20, PASS_AVG_MS + 1)).toBe(false);
});

test("röstinmatning tolkar siffror och svenska talord", () => {
  expect(parseSpokenNumber("42")).toBe(42);
  expect(parseSpokenNumber("svaret är 56")).toBe(56);
  expect(parseSpokenNumber("åtta")).toBe(8);
  expect(parseSpokenNumber("fyrtiotvå")).toBe(42);
  expect(parseSpokenNumber("Fyrtio två")).toBe(42);
  expect(parseSpokenNumber("sjuttiotvå")).toBe(72);
  expect(parseSpokenNumber("tjugo")).toBe(20);
  expect(parseSpokenNumber("nittio")).toBe(90);
  expect(parseSpokenNumber("jag vet inte")).toBeNull();
  expect(parseSpokenNumber("")).toBeNull();
});

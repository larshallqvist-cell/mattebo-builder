import { test, expect } from "bun:test";
import {
  generateQuestions, isPassed, parseSpokenNumber, passAvgMs,
  QUESTION_COUNT, TABLE_MIN, TABLE_MAX, FACTOR_MAX, PASS_SCORE,
  PASS_AVG_MS_VOICE, PASS_AVG_MS_KEYBOARD,
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

test("tidsgränsen är 1,7 s för röst och 2,7 s för tangentbord", () => {
  expect(passAvgMs("voice")).toBe(1700);
  expect(passAvgMs("keyboard")).toBe(2700);
});

test("röstläge: godkänt kräver snittid högst 1,7 sekunder", () => {
  expect(isPassed(20, PASS_AVG_MS_VOICE, "voice")).toBe(true);
  expect(isPassed(20, PASS_AVG_MS_VOICE + 1, "voice")).toBe(false);
});

test("tangentbordsläge: godkänt kräver snittid högst 2,7 sekunder", () => {
  expect(isPassed(20, PASS_AVG_MS_KEYBOARD, "keyboard")).toBe(true);
  expect(isPassed(20, PASS_AVG_MS_KEYBOARD + 1, "keyboard")).toBe(false);
});

test("2,5 s i snitt räcker för tangentbord men inte för röst", () => {
  expect(isPassed(20, 2500, "keyboard")).toBe(true);
  expect(isPassed(20, 2500, "voice")).toBe(false);
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

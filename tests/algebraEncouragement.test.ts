import { describe, expect, test } from "bun:test";
import { fastAnswerLimitMs, nextFastStreak, shouldSuggestNextLevel } from "../src/lib/algebraEncouragement";

describe("algebra encouragement", () => {
  test("requires five consecutive quick first-try answers", () => {
    let streak = 0;
    for (let i = 0; i < 4; i++) streak = nextFastStreak(streak, true, 10000, "simplify", 0);
    expect(shouldSuggestNextLevel(streak, "simplify", 0, false)).toBe(false);
    streak = nextFastStreak(streak, true, 10000, "simplify", 0);
    expect(shouldSuggestNextLevel(streak, "simplify", 0, false)).toBe(true);
  });
  test("wrong or corrected answers break the run", () => {
    expect(nextFastStreak(4, false, 1000, "simplify", 0)).toBe(0);
  });
  test("slow answers break the run at the exact time boundary", () => {
    expect(nextFastStreak(4, true, 20000, "simplify", 0)).toBe(5);
    expect(nextFastStreak(4, true, 20001, "simplify", 0)).toBe(0);
  });
  test("harder levels get more time and both steps share a doubled limit", () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(l => fastAnswerLimitMs("simplify", l))).toEqual([20000, 25000, 30000, 40000, 45000, 50000, 60000]);
    expect(fastAnswerLimitMs("both", 0)).toBe(40000);
    expect(fastAnswerLimitMs("both", 6)).toBe(120000);
  });
  test("does not repeat after declining and never offers a nonexistent level", () => {
    expect(shouldSuggestNextLevel(5, "simplify", 0, true)).toBe(false);
    expect(shouldSuggestNextLevel(5, "simplify", 6, false)).toBe(false);
    expect(shouldSuggestNextLevel(5, "both", 6, false)).toBe(false);
  });
  test("invalid timing cannot demonstrate speed", () => {
    expect(nextFastStreak(4, true, Infinity, "simplify", 0)).toBe(0);
    expect(nextFastStreak(4, true, -1, "simplify", 0)).toBe(0);
  });
});
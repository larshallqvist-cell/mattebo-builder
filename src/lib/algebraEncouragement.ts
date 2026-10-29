import { LEVELS, type Mode } from "./algebra";

export const FAST_RIGHT_REQUIRED = 5;
// Generous per-exercise limits; both steps share one total budget.
const LIMIT_SECONDS = [20, 25, 30, 40, 45, 50, 60];
export function fastAnswerLimitMs(mode: Mode, level: number): number {
  return (LIMIT_SECONDS[level] ?? 0) * 1000 * (mode === "both" ? 2 : 1);
}

export function nextFastStreak(streak: number, correctFirstTry: boolean, elapsedMs: number, mode: Mode, level: number): number {
  return correctFirstTry && Number.isFinite(elapsedMs) && elapsedMs >= 0 && elapsedMs <= fastAnswerLimitMs(mode, level)
    ? streak + 1 : 0;
}

export function shouldSuggestNextLevel(streak: number, mode: Mode, level: number, alreadySuggested: boolean): boolean {
  return streak >= FAST_RIGHT_REQUIRED && level >= 0 && level < LEVELS[mode].length - 1 && !alreadySuggested;
}
import { describe, expect, test } from "bun:test";
import { defaultEnabled, isGameEnabled, isGameOpenForGrade, VISIBILITY_CHAPTERS, type VisibilityRow } from "../src/lib/gameVisibility";

describe("game visibility matrix", () => {
  test("utan sparade val är alla spel på, utom Kistan som bara är på i Åk 6 och 7", () => {
    expect(defaultEnabled("procent", 9)).toBe(true);
    expect(defaultEnabled("kistan", 6)).toBe(true);
    expect(defaultEnabled("kistan", 7)).toBe(true);
    expect(defaultEnabled("kistan", 8)).toBe(false);
    expect(defaultEnabled("kistan", 9)).toBe(false);
  });

  test("lärarens val för en klass och ett kapitel styr bara den rutan", () => {
    const rows: VisibilityRow[] = [{ grade: 7, chapter: 2, game_key: "procent", enabled: false }];
    expect(isGameEnabled(rows, "procent", 7, 2)).toBe(false);
    expect(isGameEnabled(rows, "procent", 7, 3)).toBe(true);
    expect(isGameEnabled(rows, "procent", 8, 2)).toBe(true);
  });

  test("läraren kan slå på Kistan för Åk 8 i ett kapitel", () => {
    const rows: VisibilityRow[] = [{ grade: 8, chapter: 4, game_key: "kistan", enabled: true }];
    expect(isGameEnabled(rows, "kistan", 8, 4)).toBe(true);
    expect(isGameEnabled(rows, "kistan", 8, 1)).toBe(false);
    expect(isGameOpenForGrade(rows, "kistan", 8)).toBe(true);
  });

  test("ett spel som är av i alla kapitel är stängt för klassen", () => {
    const rows = VISIBILITY_CHAPTERS.map((chapter) => ({ grade: 6, chapter, game_key: "kistan", enabled: false }));
    expect(isGameOpenForGrade(rows, "kistan", 6)).toBe(false);
    expect(isGameOpenForGrade([], "kistan", 9)).toBe(false);
  });
});

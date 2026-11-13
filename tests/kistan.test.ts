import { describe, expect, test } from "bun:test";
import {
  cancelPair, isSolved, isUnlocked, kistanAvailable, LEVELS, mergeBest, minMoves, parseEquation, placeTile, simplifyPair, solve, stars,
} from "../src/lib/kistan";

describe("Kistan – regler", () => {
  test("samma bricka måste läggas på andra sidan", () => {
    const s = parseEquation("box+2=5");
    const r1 = placeTile(s, "2", true, "left");
    if (!r1.ok) throw new Error(r1.reason);
    expect(placeTile(r1.state, "2", true, "left").ok).toBe(false);
    expect(placeTile(r1.state, "3", true, "right").ok).toBe(false);
    expect(placeTile(r1.state, "2", true, "right").ok).toBe(true);
  });

  test("två lika brickor tar inte ut varandra", () => {
    const s = parseEquation("box+2+2=5");
    expect(cancelPair(s, "left", s.left[1].id, s.left[2].id).ok).toBe(false);
  });

  test("5 − 2 måste förenklas till 3 innan kistan räknas som ensam", () => {
    const s = parseEquation("box=5-2");
    expect(isSolved(s)).toBe(false);
    const r = simplifyPair(s, "right", s.right[0].id, s.right[1].id);
    if (!r.ok) throw new Error(r.reason);
    expect(r.state.right.map(({ kind, neg }) => ({ kind, neg }))).toEqual([{ kind: "3", neg: false }]);
    expect(isSolved(r.state)).toBe(true);
  });

  test("motsatser på svarssidan måste tas bort", () => {
    expect(isSolved(parseEquation("box=fish+bfly-fish"))).toBe(false);
  });

  test("ingen förenkling medan en bricka väntar på andra sidan", () => {
    const s = parseEquation("box=5-2");
    const placed = placeTile(s, "fish", false, "left");
    if (!placed.ok) throw new Error(placed.reason);
    expect(simplifyPair(placed.state, "right", s.right[0].id, s.right[1].id).ok).toBe(false);
  });

  test("bästa antal drag för kista + 2 = 5 är 3", () => {
    expect(minMoves(parseEquation("box+2=5"))).toBe(3);
  });

  test("x eller kistan får stå på höger sida", () => {
    expect(isSolved(parseEquation("3=x"))).toBe(true);
    expect(isSolved(parseEquation("5-2=box"))).toBe(false);
  });

  test("alla 30 nivåer går att lösa på bästa antal drag", () => {
    expect(LEVELS).toHaveLength(30);
    for (const l of LEVELS) {
      const end = solve(parseEquation(l.eq));
      expect(isSolved(end)).toBe(true);
      expect(end.moves).toBeGreaterThan(0);
    }
  });
});

describe("Kistan – stjärnor och upplåsning", () => {
  test("3 stjärnor på bästa, 2 inom två extra drag, annars 1", () => {
    expect(stars(3, 3)).toBe(3);
    expect(stars(5, 3)).toBe(2);
    expect(stars(6, 3)).toBe(1);
  });

  test("nästa nivå öppnas först när den förra är klarad, läraren ser alla", () => {
    expect(isUnlocked("1-1", {})).toBe(true);
    expect(isUnlocked("1-2", {})).toBe(false);
    expect(isUnlocked("1-2", { "1-1": { stars: 1, best_moves: 9 } })).toBe(true);
    expect(isUnlocked("3-10", {}, true)).toBe(true);
  });

  test("ett sämre resultat skriver aldrig över ett bättre", () => {
    expect(mergeBest({ stars: 3, best_moves: 3 }, 2, 5)).toBeNull();
    expect(mergeBest({ stars: 2, best_moves: 5 }, 3, 3)).toEqual({ stars: 3, best_moves: 3 });
    expect(mergeBest({ stars: 3, best_moves: 6 }, 1, 4)).toEqual({ stars: 3, best_moves: 4 });
    expect(mergeBest(undefined, 2, 7)).toEqual({ stars: 2, best_moves: 7 });
  });

  test("kistan hör bara hemma i årskurs 6 och 7, läraren ser den alltid", () => {
    expect(kistanAvailable(6)).toBe(true);
    expect(kistanAvailable(7)).toBe(true);
    expect(kistanAvailable(8)).toBe(false);
    expect(kistanAvailable(9)).toBe(false);
    expect(kistanAvailable(8, true)).toBe(true);
    expect(kistanAvailable(9, true)).toBe(true);
    expect(kistanAvailable(null)).toBe(true);
    expect(kistanAvailable(undefined)).toBe(true);
    expect(kistanAvailable(0)).toBe(true);
  });

  test("lärarens spelmatris kan öppna Kistan för Åk 8 eller stänga den för Åk 6", () => {
    expect(kistanAvailable(8, false, [{ grade: 8, chapter: 3, game_key: "kistan", enabled: true }])).toBe(true);
    const off = [1, 2, 3, 4, 5].map((chapter) => ({ grade: 6, chapter, game_key: "kistan", enabled: false }));
    expect(kistanAvailable(6, false, off)).toBe(false);
  });
});

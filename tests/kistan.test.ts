import { describe, expect, test } from "bun:test";
import {
  applyWrap, cancelPair, isSolved, isUnlocked, kistanAvailable, LEVELS, mergeBest, minMoves, opTiles, parseEquation, placeOp, placeTile,
  simplifyPair, solve, stars, WORLD_NAMES, type GameState, type Result,
} from "../src/lib/kistan";

const ok = (r: Result): GameState => { if (!r.ok) throw new Error(r.reason); return r.state; };
const show = (s: GameState) => s.left.concat(s.right).map((t) => `${t.neg ? "-" : ""}${t.coef && t.coef > 1 ? t.coef : ""}${t.kind}${t.den && t.den > 1 ? `/${t.den}` : ""}`);

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

  test("alla 40 nivåer i fyra världar går att lösa på bästa antal drag", () => {
    expect(LEVELS).toHaveLength(40);
    expect(WORLD_NAMES).toEqual(["Djungeln", "Floden", "Bergen", "Toppen"]);
    for (const l of LEVELS) {
      const end = solve(parseEquation(l.eq));
      expect(isSolved(end)).toBe(true);
      expect(end.moves).toBeGreaterThan(0);
    }
  });
});

describe("Kistan – division och parenteser", () => {
  test("3x = 12: dela båda sidor med 3 ger x = 4", () => {
    let s = parseEquation("3x=12");
    s = ok(placeOp(s, "div", 3, "left"));
    expect(placeTile(s, "2", false, "right").ok).toBe(false);
    expect(placeOp(s, "div", 4, "right").ok).toBe(false);
    s = ok(placeOp(s, "div", 3, "right"));
    s = ok(applyWrap(ok(applyWrap(s, "left")), "right"));
    expect(show(s)).toEqual(["box", "4"]);
    expect(isSolved(s)).toBe(true);
  });

  test("en negativ koefficient delas bort med ett negativt tal: −2x = 14 ger x = −7", () => {
    let s = parseEquation("-2x=14");
    s = ok(placeOp(ok(placeOp(s, "div", -2, "left")), "div", -2, "right"));
    s = ok(applyWrap(ok(applyWrap(s, "left")), "right"));
    expect(show(s)).toEqual(["box", "-7"]);
    expect(isSolved(s)).toBe(true);
  });

  test("delar man −2x med 2 står −x kvar, och då är kistan inte ensam", () => {
    let s = parseEquation("-2x=14");
    s = ok(placeOp(ok(placeOp(s, "div", 2, "left")), "div", 2, "right"));
    s = ok(applyWrap(ok(applyWrap(s, "left")), "right"));
    expect(show(s)).toEqual(["-box", "7"]);
    expect(isSolved(s)).toBe(false);
  });

  test("x/3 = 4: multiplicera med 3 ger x = 12", () => {
    let s = parseEquation("x/3=4");
    s = ok(placeOp(ok(placeOp(s, "mul", 3, "left")), "mul", 3, "right"));
    s = ok(applyWrap(ok(applyWrap(s, "left")), "right"));
    expect(show(s)).toEqual(["box", "12"]);
  });

  test("tal som inte går jämnt ut kan inte delas", () => {
    let s = parseEquation("3x+4=25");
    s = ok(placeOp(ok(placeOp(s, "div", 3, "left")), "div", 3, "right"));
    expect(applyWrap(s, "left").ok).toBe(false);
    expect(applyWrap(s, "right").ok).toBe(false);
  });

  test("dela bort talet framför parentesen: 3(x+2) = 21 blir x + 2 = 7", () => {
    let s = parseEquation("3(x+2)=21");
    s = ok(placeOp(ok(placeOp(s, "div", 3, "left")), "div", 3, "right"));
    s = ok(applyWrap(ok(applyWrap(s, "left")), "right"));
    expect(show(s)).toEqual(["box", "2", "7"]);
  });

  test("3(x+2)+4 = 25 tar tre moment (9 drag) och ger x = 5", () => {
    const end = solve(parseEquation("3(x+2)+4=25"));
    expect(isSolved(end)).toBe(true);
    expect(show(end)).toEqual(["box", "5"]);
    expect(end.moves).toBe(9);
  });

  test("räkneverktygen visar koefficienten med plus och minus, och nämnaren", () => {
    expect(opTiles(parseEquation("3(x+2)+4=25"))).toEqual([{ op: "div", n: 3 }, { op: "div", n: -3 }]);
    expect(opTiles(parseEquation("x/2+3=8"))).toEqual([{ op: "mul", n: 2 }]);
    expect(opTiles(parseEquation("box+2=fish"))).toEqual([]);
  });

  test("Bergen har koefficient eller division på varje nivå, Toppen har parentes på varje nivå", () => {
    for (const l of LEVELS.filter((x) => x.world === 3)) expect(l.eq).toMatch(/\dx|x\//);
    for (const l of LEVELS.filter((x) => x.world === 4)) expect(l.eq).toContain("(");
  });

  test("varje nivå i Toppen kräver minst två moment och de flesta tre", () => {
    const mins = LEVELS.filter((l) => l.world === 4).map((l) => minMoves(parseEquation(l.eq)));
    expect(Math.min(...mins)).toBeGreaterThanOrEqual(6);
    expect(mins.filter((m) => m >= 9).length).toBeGreaterThanOrEqual(7);
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

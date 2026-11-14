import { describe, expect, test } from "bun:test";
import { checkAnswer, fmtEq, generateTask, LINJE_TIERS, stepStart, type LinjeMode, type LinjeTask } from "../src/lib/linjen";

const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const many = (mode: LinjeMode, tier: number, n = 500) => {
  const rnd = seeded(tier + 11); let prev: LinjeTask | undefined; const out: LinjeTask[] = [];
  for (let i = 0; i < n; i++) { prev = generateTask(mode, tier, rnd, prev); out.push(prev); }
  return out;
};

describe("Räta linjen – steg", () => {
  test("steg 1–2 har bara positiv lutning, steg 3 bara negativ", () => {
    for (const tier of [0, 1]) expect(many("k", tier).every((t) => t.k > 0)).toBe(true);
    expect(many("k", 2).every((t) => t.k < 0)).toBe(true);
  });
  test("steg 1 har positivt m, negativt m kommer på steg 2", () => {
    expect(many("m", 0).every((t) => t.m >= 1)).toBe(true);
    expect(many("m", 1).some((t) => t.m < 0)).toBe(true);
  });
  test("vågräta linjer (k = 0) kommer först på steg 4", () => {
    for (const tier of [0, 1, 2, 4]) expect(many("k", tier).some((t) => t.k === 0)).toBe(false);
    expect(many("k", 3).some((t) => t.k === 0)).toBe(true);
  });
  test("k och m är alltid heltal och trappsteget syns i rutnätet", () => {
    for (let tier = 0; tier < LINJE_TIERS.length; tier++) for (const t of many("ekv", tier)) {
      expect(Number.isInteger(t.k) && Number.isInteger(t.m)).toBe(true);
      expect(Math.abs(t.m)).toBeLessThanOrEqual(5);
      const s = stepStart(t.k, t.m);
      expect(Math.abs(s.y)).toBeLessThanOrEqual(5);
      expect(Math.abs(s.y + t.k)).toBeLessThanOrEqual(5);
    }
  });
  test("samma linje kommer aldrig två gånger i rad", () => {
    const ts = many("ekv", 0);
    for (let i = 1; i < ts.length; i++) expect(fmtEq(ts[i].k, ts[i].m)).not.toBe(fmtEq(ts[i - 1].k, ts[i - 1].m));
  });
});

describe("Räta linjen – rättning", () => {
  const t = (mode: LinjeMode, k: number, m: number): LinjeTask => ({ mode, k, m, tier: 4 });
  test("rätt m, k och ekvation godkänns", () => {
    expect(checkAnswer(t("m", 2, -3), { m: -3 }).correct).toBe(true);
    expect(checkAnswer(t("k", -2, 1), { k: -2 }).correct).toBe(true);
    expect(checkAnswer(t("ekv", -2, 1), { k: -2, m: 1 }).correct).toBe(true);
  });
  test("k i stället för m känns igen", () => expect(checkAnswer(t("m", 2, -3), { m: 2 }).error).toBe("swapped"));
  test("skärningen med x-axeln i stället för m känns igen", () => expect(checkAnswer(t("m", 2, -4), { m: 2 }).error).toBe("swapped"));
  test("x-skärning när den inte är k", () => expect(checkAnswer(t("m", 1, -3), { m: 3 }).error).toBe("sign"));
  test("x-skärning känns igen", () => expect(checkAnswer(t("m", 2, 4), { m: -2 }).error).toBe("xintercept"));
  test("fel tecken på k känns igen", () => expect(checkAnswer(t("k", -3, 1), { k: 3 }).error).toBe("sign"));
  test("steget räknat åt fel håll (1/k) känns igen", () => expect(checkAnswer(t("k", 2, 1), { k: 0.5 }).error).toBe("inverted"));
  test("k och m ombytta i ekvationen känns igen", () => expect(checkAnswer(t("ekv", 3, -1), { k: -1, m: 3 }).error).toBe("swapped"));
  test("fel tecken på m i ekvationen känns igen", () => expect(checkAnswer(t("ekv", 3, -1), { k: 3, m: 1 }).error).toBe("sign"));
  test("vågrät linje: fel svar ger förklaringen k = 0", () => expect(checkAnswer(t("k", 0, 2), { k: 1 }).message).toContain("k = 0"));
});

describe("Räta linjen – ekvationen skrivs som i boken", () => {
  test("olika k och m", () => {
    expect(fmtEq(2, 3)).toBe("y = 2x + 3");
    expect(fmtEq(-1, -2)).toBe("y = −x − 2");
    expect(fmtEq(1, 0)).toBe("y = x");
    expect(fmtEq(0, 3)).toBe("y = 3");
    expect(fmtEq(-2, 0)).toBe("y = −2x");
  });
});

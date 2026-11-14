import { describe, expect, test } from "bun:test";
import {
  checkAnswer, fmtEq, generateTask, LINJE_TIERS, lineThrough, makeLine, parseNum, stepStart,
  type LinjeMode, type LinjeTask,
} from "../src/lib/linjen";

const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const many = (mode: LinjeMode, tier: number, n = 500) => {
  const rnd = seeded(tier + 11); let prev: LinjeTask | undefined; const out: LinjeTask[] = [];
  for (let i = 0; i < n; i++) { prev = generateTask(mode, tier, rnd, prev); out.push(prev); }
  return out;
};
const read = (mode: LinjeMode, kp: number, m: number, kq = 1): LinjeTask => ({ mode, tier: 4, kind: mode === "rita" ? "draw" : "read", ...makeLine(kp, kq, m) });

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
  test("steg 1–5 har heltals-k, steg 6 har bara k som bråk", () => {
    for (const tier of [0, 1, 2, 3, 4]) expect(many("ekv", tier).every((t) => t.kq === 1)).toBe(true);
    const ts = many("ekv", 5);
    expect(ts.every((t) => t.kq > 1)).toBe(true);
    expect(new Set(ts.map((t) => `${t.kp}/${t.kq}`))).toEqual(new Set(["1/2", "-1/2", "1/3", "-1/3", "2/3", "-2/3", "3/2", "-3/2"]));
  });
  test("m är heltal och trappsteget syns i rutnätet på alla steg", () => {
    for (let tier = 0; tier < LINJE_TIERS.length; tier++) for (const t of many("ekv", tier)) {
      expect(Number.isInteger(t.m)).toBe(true);
      expect(Math.abs(t.m)).toBeLessThanOrEqual(5);
      const s = stepStart(t);
      expect(Math.abs(s.y)).toBeLessThanOrEqual(5);
      expect(Math.abs(s.y + t.kp)).toBeLessThanOrEqual(5);
      expect(s.x).toBeGreaterThanOrEqual(-5); expect(s.x + t.kq).toBeLessThanOrEqual(5);
    }
  });
  test("samma linje kommer aldrig två gånger i rad", () => {
    const ts = many("rita", 0);
    for (let i = 1; i < ts.length; i++) expect(fmtEq(ts[i])).not.toBe(fmtEq(ts[i - 1]));
  });
});

describe("Räta linjen – avläsning", () => {
  test("rätt m, k och ekvation godkänns", () => {
    expect(checkAnswer(read("m", 2, -3), { m: -3 }).correct).toBe(true);
    expect(checkAnswer(read("k", -2, 1), { k: -2 }).correct).toBe(true);
    expect(checkAnswer(read("ekv", -2, 1), { k: -2, m: 1 }).correct).toBe(true);
  });
  test("k i stället för m känns igen", () => expect(checkAnswer(read("m", 2, -3), { m: 2 }).error).toBe("swapped"));
  test("fel tecken på m känns igen", () => expect(checkAnswer(read("m", 1, -3), { m: 3 }).error).toBe("sign"));
  test("x-skärning känns igen", () => expect(checkAnswer(read("m", 2, 4), { m: -2 }).error).toBe("xintercept"));
  test("fel tecken på k känns igen", () => expect(checkAnswer(read("k", -3, 1), { k: 3 }).error).toBe("sign"));
  test("steget räknat åt fel håll (1/k) känns igen", () => expect(checkAnswer(read("k", 2, 1), { k: 0.5 }).error).toBe("inverted"));
  test("k och m ombytta i ekvationen känns igen", () => expect(checkAnswer(read("ekv", 3, -1), { k: -1, m: 3 }).error).toBe("swapped"));
  test("fel tecken på m i ekvationen känns igen", () => expect(checkAnswer(read("ekv", 3, -1), { k: 3, m: 1 }).error).toBe("sign"));
  test("vågrät linje: fel svar ger förklaringen k = 0", () => expect(checkAnswer(read("k", 0, 2), { k: 1 }).message).toContain("k = 0"));
});

describe("Räta linjen – k som bråk", () => {
  test("2/3 skrivet som bråk godkänns, avrundad decimal godkänns inte", () => {
    const t = read("k", 2, 1, 3);
    expect(checkAnswer(t, { k: parseNum("2/3")! }).correct).toBe(true);
    expect(checkAnswer(t, { k: parseNum("0,67")! }).correct).toBe(false);
  });
  test("½ kan skrivas 1/2 eller 0,5", () => {
    const t = read("k", -1, 2, 2);
    expect(checkAnswer(t, { k: parseNum("−1/2")! }).correct).toBe(true);
    expect(checkAnswer(t, { k: parseNum("-0,5")! }).correct).toBe(true);
  });
  test("glömt att dela med stegen åt höger känns igen", () => expect(checkAnswer(read("k", 2, 1, 3), { k: 2 }).error).toBe("rise"));
  test("uppochnedvänt bråk känns igen", () => expect(checkAnswer(read("k", 2, 1, 3), { k: 1.5 }).error).toBe("inverted"));
  test("bråk tolkas, nämnare 0 avvisas", () => {
    expect(parseNum("3/2")).toBe(1.5); expect(parseNum("1/0")).toBeNull(); expect(parseNum("tre")).toBeNull();
  });
  test("ekvationen skrivs med parentes runt bråket", () => expect(fmtEq(makeLine(2, 3, -1))).toBe("y = (2/3)x − 1"));
  test("bråket förkortas", () => expect(makeLine(4, 6, 0)).toMatchObject({ kp: 2, kq: 3 }));
});

describe("Räta linjen – rita linjen", () => {
  const t = read("rita", 2, -1);
  test("två punkter på linjen godkänns, var som helst på den", () => {
    expect(checkAnswer(t, { points: [{ x: 0, y: -1 }, { x: 1, y: 1 }] }).correct).toBe(true);
    expect(checkAnswer(t, { points: [{ x: 2, y: 3 }, { x: -1, y: -3 }] }).correct).toBe(true);
  });
  test("bråk-k: rätt trappsteg (3 åt höger, 2 upp) godkänns", () => {
    expect(checkAnswer(read("rita", 2, 1, 3), { points: [{ x: 0, y: 1 }, { x: 3, y: 3 }] }).correct).toBe(true);
  });
  test("fel lutningsriktning känns igen", () => expect(checkAnswer(t, { points: [{ x: 0, y: -1 }, { x: 1, y: -3 }] }).error).toBe("sign"));
  test("m utsatt på x-axeln känns igen", () => expect(checkAnswer(read("rita", 1, 3), { points: [{ x: 3, y: 0 }, { x: 4, y: 1 }] }).error).toBe("xintercept"));
  test("k och m ombytta känns igen", () => expect(checkAnswer(t, { points: [{ x: 0, y: 2 }, { x: 1, y: 1 }] }).error).toBe("swapped"));
  test("bråk: steg upp utan att dela känns igen", () => expect(checkAnswer(read("rita", 2, 1, 3), { points: [{ x: 0, y: 1 }, { x: 1, y: 3 }] }).error).toBe("rise"));
  test("lodrät linje och samma punkt godkänns inte", () => {
    expect(lineThrough({ x: 1, y: 1 }, { x: 1, y: 3 })).toBeNull();
    expect(checkAnswer(t, { points: [{ x: 0, y: -1 }, { x: 0, y: -1 }] }).correct).toBe(false);
  });
});

describe("Räta linjen – parallella linjer", () => {
  test("Parallella växlar mellan att välja par och gå genom en punkt", () => {
    const ts = many("parallell", 2, 20);
    for (let i = 1; i < ts.length; i++) expect(ts[i].kind).not.toBe(ts[i - 1].kind);
  });
  test("välj par: exakt två av fyra linjer har samma k, och en lockbetes-linje har samma m", () => {
    for (let tier = 0; tier < LINJE_TIERS.length; tier++) for (const t of many("parallell", tier, 200).filter((x) => x.kind === "pair")) {
      const o = t.options!;
      expect(o.length).toBe(4);
      const pairs = [];
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (Math.abs(o[i].k - o[j].k) < 1e-9) pairs.push([i, j]);
      expect(pairs).toEqual([t.pair!]);
      const [a, b] = t.pair!.map((i) => o[i]);
      expect(a.m).not.toBe(b.m);
      expect(o.some((l, i) => !t.pair!.includes(i) && (l.m === a.m || l.m === b.m))).toBe(true);
    }
  });
  test("välj par: rätt par godkänns, samma m och motsatt k känns igen", () => {
    const t: LinjeTask = { mode: "parallell", tier: 3, kind: "pair", ...makeLine(2, 1, 1),
      options: [makeLine(2, 1, 1), makeLine(-2, 1, 3), makeLine(2, 1, -2), makeLine(1, 1, 1)], pair: [0, 2] };
    expect(checkAnswer(t, { pick: [2, 0] }).correct).toBe(true);
    expect(checkAnswer(t, { pick: [0, 3] }).error).toBe("same_m");
    expect(checkAnswer(t, { pick: [0, 1] }).error).toBe("sign");
  });
  test("genom punkt: samma k som den givna, och punkten ligger på den nya linjen", () => {
    for (const tier of [0, 3, 5]) for (const t of many("parallell", tier, 200).filter((x) => x.kind === "through")) {
      expect(t.k).toBe(t.base!.k);
      expect(t.m).not.toBe(t.base!.m);
      expect(Math.abs(t.k * t.point!.x + t.m - t.point!.y)).toBeLessThan(1e-9);
      if (tier < 3) expect(t.point!.x).toBe(0); else expect(t.point!.x).not.toBe(0);
    }
  });
  test("genom punkt: rätt ekvation godkänns, den givna linjens m känns igen", () => {
    const t: LinjeTask = { mode: "parallell", tier: 3, kind: "through", ...makeLine(2, 1, -3), base: makeLine(2, 1, 1), point: { x: 2, y: 1 } };
    expect(checkAnswer(t, { k: 2, m: -3 }).correct).toBe(true);
    expect(checkAnswer(t, { k: 2, m: 1 }).error).toBe("same_m");
    expect(checkAnswer(t, { k: -2, m: -3 }).error).toBe("sign");
    expect(checkAnswer(t, { k: 2, m: 1 }).correct).toBe(false);
  });
});

describe("Räta linjen – ekvationen skrivs som i boken", () => {
  test("olika k och m", () => {
    expect(fmtEq(makeLine(2, 1, 3))).toBe("y = 2x + 3");
    expect(fmtEq(makeLine(-1, 1, -2))).toBe("y = −x − 2");
    expect(fmtEq(makeLine(1, 1, 0))).toBe("y = x");
    expect(fmtEq(makeLine(0, 1, 3))).toBe("y = 3");
    expect(fmtEq(makeLine(-2, 1, 0))).toBe("y = −2x");
  });
});

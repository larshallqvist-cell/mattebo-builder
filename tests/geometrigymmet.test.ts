import { describe, expect, it } from "bun:test";
import {
  gradeSpread, nextNameGap, praise, scoreSpread, spreadQuestions, SPREAD_SIZE,
  availableSkills, checkAnswer, convert, emptyProgress, generateQuestion, geometrigymmetAvailable, ladderFor, MASTERY_THRESHOLD,
  newQuestion, nextSkill, parseProgress, recordAnswer, ROUND_LENGTH, SKILLS, STAGES, unlockedStage,
} from "../src/lib/geometrigymmet";

describe("Geometrigymmet", () => {
  it("needs 8 correct in a row and has 8 questions per round", () => {
    expect(MASTERY_THRESHOLD).toBe(8);
    expect(ROUND_LENGTH).toBe(8);
  });

  it("starts with cm ↔ dm and L ↔ dl, and unlocks the next stage only after both", () => {
    let p = emptyProgress();
    expect(STAGES[0].skills.map((s) => s.id)).toEqual(["cm-dm", "L-dl"]);
    for (let i = 0; i < 7; i++) p = recordAnswer(p, "cm-dm", true);
    expect(p.skills["cm-dm"].mastered).toBe(false);
    p = recordAnswer(p, "cm-dm", true);
    expect(p.skills["cm-dm"].mastered).toBe(true);
    expect(unlockedStage(p)).toBe(0);
    expect(nextSkill(p).id).toBe("L-dl");
    for (let i = 0; i < 8; i++) p = recordAnswer(p, "L-dl", true);
    expect(unlockedStage(p)).toBe(1);
    expect(availableSkills(p).map((s) => s.id)).toContain("mm-cm");
    expect(availableSkills(p).map((s) => s.id)).not.toContain("volume");
  });

  it("a wrong answer resets only that streak and keeps mastered skills", () => {
    let p = emptyProgress();
    for (let i = 0; i < 8; i++) p = recordAnswer(p, "cm-dm", true);
    p = recordAnswer(p, "L-dl", true);
    p = recordAnswer(p, "L-dl", false);
    expect(p.skills["L-dl"].streak).toBe(0);
    expect(p.skills["cm-dm"].mastered).toBe(true);
    expect(p.totalCorrect).toBe(9);
  });

  it("puts a mastered skill up for review every fourth round", () => {
    let p = emptyProgress();
    for (let i = 0; i < 8; i++) p = recordAnswer(p, "cm-dm", true);
    expect(nextSkill({ ...p, rounds: 4 }).id).toBe("cm-dm");
    expect(nextSkill({ ...p, rounds: 5 }).id).toBe("L-dl");
  });

  for (const [v, from, to, r] of [[1, "dm³", "L", 1], [1, "cm³", "ml", 1], [1, "m³", "L", 1000], [1, "km", "mm", 1_000_000], [1, "kg", "hg", 10], [1, "hg", "g", 100], [1, "L", "dl", 10], [1, "cm", "dm", 0.1]] as const) {
    it(`converts ${v} ${from} = ${r} ${to}`, () => {
      expect(convert(v, from, to)).toBe(r);
      expect(convert(r, to, from)).toBe(v);
    });
  }

  it("accepts a decimal comma and rejects wrong numbers or the wrong unit", () => {
    const q = { ...generateQuestion(SKILLS[0], () => 0), from: "cm" as const, to: "dm" as const, value: 15, answer: 1.5 };
    expect(checkAnswer(q, "1,5")).toBe(true);
    expect(checkAnswer(q, "1.5")).toBe(true);
    expect(checkAnswer(q, "15")).toBe(false);
    expect(checkAnswer(q, "")).toBe(false);
    expect(checkAnswer(q, "1,5abc")).toBe(false);
    expect(checkAnswer(q, "1,5", "cm")).toBe(false);
  });

  it("generates correct conversions, whole numbers before the final review", () => {
    STAGES.forEach((stage, index) => stage.skills.forEach((s) => {
      for (let i = 0; i < 200; i++) {
        const q = generateQuestion(s);
        expect(q.answer).toBe(convert(q.value, q.from, q.to));
        expect(s.pairs.some((p) => p.includes(q.from) && p.includes(q.to))).toBe(true);
        if (index < STAGES.length - 1) {
          expect(Number.isInteger(q.value)).toBe(true);
          expect(Number.isInteger(q.answer)).toBe(true);
        }
      }
    }));
  });

  it("never repeats the exact previous question", () => {
    const s = SKILLS[0];
    const prev = generateQuestion(s, () => 0);
    const next = newQuestion(s, prev, () => 0);
    expect(next.value).not.toBe(prev.value);
    expect(next.answer).toBe(convert(next.value, next.from, next.to));
  });

  it("uses decimals and unit choice only in the final review", () => {
    const final = SKILLS.find((s) => s.id === "review")!;
    const q = generateQuestion(final, () => 0);
    expect(q.value).toBe(0.1);
    expect(q.chooseUnit).toBe(true);
    expect(SKILLS.filter((s) => s.decimals || s.chooseUnit).map((s) => s.id)).toEqual(["review"]);
  });

  it("only uses the listed units", () => {
    const allowed = ["km", "m", "dm", "cm", "mm", "kg", "hg", "g", "L", "dl", "cl", "ml", "m³", "dm³", "cm³"];
    for (const s of SKILLS) for (const p of s.pairs) for (const u of p) expect(allowed).toContain(u);
  });

  it("shows a ladder only within one family", () => {
    expect(ladderFor({ from: "m", to: "cm" })).toEqual(["m", "dm", "cm"]);
    expect(ladderFor({ from: "dm³", to: "L" })).toBeNull();
  });

  it("ignores malformed stored progress", () => {
    expect(parseProgress("x")).toEqual(emptyProgress());
    const p = parseProgress({ skills: { "cm-dm": { streak: 2, correct: 5, attempts: 6, mastered: false }, hack: { streak: 1 }, "L-dl": { streak: -1, correct: 0, attempts: 0, mastered: true } }, rounds: 3, totalCorrect: 5 });
    expect(Object.keys(p.skills)).toEqual(["cm-dm"]);
    expect(p.rounds).toBe(3);
  });

  it("is open to Åk 7 by default and closed to Åk 6, 8 and 9", () => {
    expect(geometrigymmetAvailable(7)).toBe(true);
    expect(geometrigymmetAvailable(6)).toBe(false);
    expect(geometrigymmetAvailable(8)).toBe(false);
    expect(geometrigymmetAvailable(9)).toBe(false);
    expect(geometrigymmetAvailable(9, true)).toBe(true);
  });

  it("gives +10 per right, -5 per wrong and never below 0", () => {
    expect(scoreSpread([true, true, true, false], null)).toBe(25);
    expect(scoreSpread([false, false, false, false], null)).toBe(0);
    expect(scoreSpread([true, false, false, false], null)).toBe(0);
  });

  it("gives a time bonus only for a fully right spread, at most 20", () => {
    expect(scoreSpread([true, true, true, true], 30)).toBe(50);
    expect(scoreSpread([true, true, true, true], 5)).toBe(60);
    expect(scoreSpread([true, true, true, true], 50)).toBe(40);
    expect(scoreSpread([true, true, true, false], 5)).toBe(25);
  });

  it("makes four different questions per spread and grades each box", () => {
    for (let k = 0; k < 50; k++) {
      const qs = spreadQuestions(SKILLS[0]);
      expect(qs.length).toBe(SPREAD_SIZE);
      expect(new Set(qs.map((q) => `${q.from}${q.to}${q.value}`)).size).toBe(SPREAD_SIZE);
      const inputs = qs.map((q, i) => (i === 3 ? String(q.answer + 1) : String(q.answer).replace(".", ",")));
      expect(gradeSpread(qs, inputs)).toEqual([true, true, true, false]);
    }
  });

  it("a wrong last box in a spread resets the streak", () => {
    let p = emptyProgress();
    for (const ok of [true, true, true, false]) p = recordAnswer(p, "cm-dm", ok);
    expect(p.skills["cm-dm"].streak).toBe(0);
    expect(p.skills["cm-dm"].correct).toBe(3);
  });

  it("says the name only every 5th to 8th praise", () => {
    for (let k = 0; k < 30; k++) {
      let until = nextNameGap();
      const named: number[] = [];
      for (let i = 0; i < 60; i++) {
        const r = praise("Alva", 0, until);
        until = r.untilName;
        if (r.text.includes("Alva")) named.push(i);
      }
      for (let j = 1; j < named.length; j++) {
        const gap = named[j] - named[j - 1];
        expect(gap).toBeGreaterThanOrEqual(6);
        expect(gap).toBeLessThanOrEqual(9);
      }
    }
  });

  it("reads old saved progress with new fields defaulted", () => {
    const p = parseProgress({ skills: {}, rounds: 2, totalCorrect: 4 });
    expect(p.points).toBe(0);
    expect(p.timed).toBe(false);
    expect(p.bestSeconds).toEqual({});
  });
});

it("välj enhet godkänner varje likvärdig enhet", () => {
  const q = { skillId: "review", from: "L", to: "m³", value: 0.4, answer: 0.0004, chooseUnit: true, choices: ["m","cm","kg","g","L","ml","m³","dm³","cm³"], mission: "" } as any;
  expect(checkAnswer(q, "400", "cm³")).toBe(true);
  expect(checkAnswer(q, "0,4", "dm³")).toBe(true);
  expect(checkAnswer(q, "40", "cm³")).toBe(false);
  expect(checkAnswer(q, "400", "g")).toBe(false);

});

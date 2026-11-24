import { describe, expect, it } from "bun:test";
import { isSolved, LEVELS, replayMoves } from "@/lib/kistan";
import { applySpread, emptyProgress, spreadQuestions, SKILLS } from "@/lib/geometrigymmet";

describe("Kistan server replay", () => {
  it("accepts a real solution of 1-1 and rejects an empty claim", () => {
    const lvl = LEVELS[0];
    expect(isSolved(replayMoves(lvl.eq, [])!)).toBe(false);
  });
  it("rejects a move that breaks the rules", () => {
    expect(replayMoves(LEVELS[0].eq, [{ a: "wrap", side: "left" }])).toBeNull();
  });
});

describe("Geometrigymmet spread scoring", () => {
  it("gives +10 per right and −5 per wrong, never below 0", () => {
    const qs = spreadQuestions(SKILLS[0]);
    expect(applySpread(emptyProgress(), qs, [true, true, true, false], null, false, 0).points).toBe(25);
    expect(applySpread(emptyProgress(), qs, [false, false, false, true], null, false, 0).points).toBe(0);
  });
  it("counts a round and best round only on the last spread", () => {
    const qs = spreadQuestions(SKILLS[0]);
    const r = applySpread(emptyProgress(), qs, [true, true, true, true], null, true, 30);
    expect(r.progress.rounds).toBe(1);
    expect(r.progress.bestRound).toBe(70);
  });
});

import { expect, test } from "bun:test";
import { cheerReason, pickCheer, type CheerState } from "../src/lib/brakCheers";

const s = (o: Partial<CheerState>): CheerState => ({ streakBefore: 0, streak: 1, tierBefore: 0, tier: 0, recordBefore: 0, streakPoints: 1, recordCheered: false, ...o });

test("5, 10 och 20 rätt i rad ger beröm, andra antal inte", () => {
  expect(cheerReason(s({ streakBefore: 4, streak: 5 }))).toBe("streak");
  expect(cheerReason(s({ streakBefore: 9, streak: 10 }))).toBe("streak");
  expect(cheerReason(s({ streakBefore: 19, streak: 20 }))).toBe("streak");
  expect(cheerReason(s({ streakBefore: 5, streak: 6 }))).toBeNull();
});
test("fel svar ger aldrig beröm", () => {
  expect(cheerReason(s({ streakBefore: 4, streak: 0, tier: 1 }))).toBeNull();
});
test("nytt steg går före allt annat", () => {
  expect(cheerReason(s({ streakBefore: 4, streak: 5, tierBefore: 1, tier: 2, recordBefore: 3, streakPoints: 5 }))).toBe("tier");
});
test("nytt rekord bara en gång per svit och bara om det fanns ett rekord", () => {
  expect(cheerReason(s({ streakBefore: 2, streak: 3, recordBefore: 2, streakPoints: 3 }))).toBe("record");
  expect(cheerReason(s({ streakBefore: 2, streak: 3, recordBefore: 2, streakPoints: 3, recordCheered: true }))).toBeNull();
  expect(cheerReason(s({ streakBefore: 2, streak: 3, recordBefore: 0, streakPoints: 3 }))).toBeNull();
});
test("samma kändis kommer inte två gånger i rad", () => {
  for (let i = 0; i < 50; i++) expect(pickCheer("streak", { streak: 5, tier: 0 }, "zlatan").id).not.toBe("zlatan");
});

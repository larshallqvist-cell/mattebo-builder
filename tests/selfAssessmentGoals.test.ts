import { describe, expect, test } from "bun:test";
import {
  classOverview, distribution, latestPerSection, levelOf, sectionOverview, studentOverview, type GoalRow,
} from "../src/lib/selfAssessmentGoals";

const row = (user_id: string, grade: number, chapter: number, section_index: number, ratings: number[], updated_at = "2026-11-01"): GoalRow =>
  ({ user_id, grade, chapter, section_index, ratings, updated_at });

describe("måluppfyllelse från självskattning", () => {
  test("andel säkra = ganska säker + helt säker, gamla skalvärden räknas inte", () => {
    const d = distribution([1, 2, 3, 3, 0, 4]);
    expect(d.counts).toEqual([1, 1, 2]);
    expect(d.total).toBe(4);
    expect(d.secure).toBe(0.75);
    expect(d.mean).toBe(2.25);
    expect(distribution([]).mean).toBeNull();
  });

  test("färgnivå efter elevens snitt", () => {
    expect(levelOf(null)).toBe(0);
    expect(levelOf(1.5)).toBe(1);
    expect(levelOf(2)).toBe(2);
    expect(levelOf(2.5)).toBe(3);
  });

  test("senaste svaret per elev och delkapitel gäller", () => {
    const rows = latestPerSection([row("a", 6, 2, 0, [1], "2026-10-01"), row("a", 6, 2, 0, [3], "2026-11-01")]);
    expect(rows).toHaveLength(1);
    expect(rows[0].ratings).toEqual([3]);
  });

  test("klass, delkapitel och elev summeras var för sig", () => {
    const rows = [
      row("a", 6, 2, 0, [3, 3]),
      row("b", 6, 2, 0, [1, 2]),
      row("a", 6, 2, 1, [1, 1]),
      row("c", 7, 2, 0, [2]),
    ];
    const classes = classOverview(rows, [6, 7, 8]);
    expect(classes[0].dist.counts).toEqual([3, 1, 2]);
    expect(classes[0].students).toBe(2);
    expect(classes[1].students).toBe(1);
    expect(classes[2].dist.total).toBe(0);

    const sections = sectionOverview(rows, 6, 2, 3);
    expect(sections[0].dist.secure).toBe(0.75);
    expect(sections[1].students).toBe(1);
    expect(sections[2].dist.total).toBe(0);

    const [a, b, d] = studentOverview(rows, 6, 2, 3, ["a", "b", "d"]);
    expect(a.total.counts).toEqual([2, 0, 2]);
    expect(a.sections[2]).toBeNull();
    expect(b.sections[1]).toBeNull();
    expect(d.total.total).toBe(0);
  });
});

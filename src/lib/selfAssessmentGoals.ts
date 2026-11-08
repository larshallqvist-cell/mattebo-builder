/** Goal attainment from self-assessments: answer distributions per class, sub-chapter and student. */
import { isScaleValue } from "@/lib/selfAssessment";

export interface GoalRow {
  user_id: string;
  grade: number;
  chapter: number;
  section_index: number;
  ratings: number[];
  updated_at?: string | null;
}

export interface Dist {
  /** counts[v - 1] = answers on level v (1 = med hjälp, 2 = ganska säker, 3 = helt säker). */
  counts: [number, number, number];
  total: number;
  /** Share (0–1) of answers on "ganska säker" or "helt säker"; 0 when there are no answers. */
  secure: number;
  /** Average level 1–3, null without answers. */
  mean: number | null;
}

const finish = (counts: [number, number, number]): Dist => {
  const total = counts[0] + counts[1] + counts[2];
  return {
    counts,
    total,
    secure: total ? (counts[1] + counts[2]) / total : 0,
    mean: total ? (counts[0] + 2 * counts[1] + 3 * counts[2]) / total : null,
  };
};

/** Answers outside the current 1–3 scale (older scales) are ignored. */
export const distribution = (ratings: number[]): Dist => {
  const counts: [number, number, number] = [0, 0, 0];
  for (const v of ratings) if (isScaleValue(v)) counts[v - 1]++;
  return finish(counts);
};

export const mergeDist = (list: Dist[]): Dist => {
  const counts: [number, number, number] = [0, 0, 0];
  for (const d of list) for (let i = 0; i < 3; i++) counts[i] += d.counts[i];
  return finish(counts);
};

/** Colour level for a student's average: below 1,67 → 1, below 2,34 → 2, otherwise 3. */
export const levelOf = (mean: number | null): 0 | 1 | 2 | 3 =>
  mean === null ? 0 : mean < 5 / 3 ? 1 : mean < 7 / 3 ? 2 : 3;

/** One answer per student and sub-chapter: the most recently updated one wins. */
export const latestPerSection = (rows: GoalRow[]): GoalRow[] => {
  const best = new Map<string, GoalRow>();
  for (const r of rows) {
    const key = `${r.user_id}|${r.grade}|${r.chapter}|${r.section_index}`;
    const prev = best.get(key);
    if (!prev || (r.updated_at ?? "") > (prev.updated_at ?? "")) best.set(key, r);
  }
  return [...best.values()];
};

const studentsWithAnswers = (rows: GoalRow[]) =>
  new Set(rows.filter((r) => distribution(r.ratings).total > 0).map((r) => r.user_id)).size;

/** Per class page: all answers across every chapter. */
export const classOverview = (rows: GoalRow[], grades: readonly number[]) =>
  grades.map((grade) => {
    const own = latestPerSection(rows).filter((r) => r.grade === grade);
    return { grade, dist: mergeDist(own.map((r) => distribution(r.ratings))), students: studentsWithAnswers(own) };
  });

/** Per sub-chapter of one class chapter. */
export const sectionOverview = (rows: GoalRow[], grade: number, chapter: number, sectionCount: number) => {
  const own = latestPerSection(rows).filter((r) => r.grade === grade && r.chapter === chapter);
  return Array.from({ length: sectionCount }, (_, index) => {
    const here = own.filter((r) => r.section_index === index);
    return { index, dist: mergeDist(here.map((r) => distribution(r.ratings))), students: studentsWithAnswers(here) };
  });
};

/** Per student in one class chapter: chapter total plus each sub-chapter (null = not answered). */
export const studentOverview = (rows: GoalRow[], grade: number, chapter: number, sectionCount: number, userIds: string[]) => {
  const own = latestPerSection(rows).filter((r) => r.grade === grade && r.chapter === chapter);
  return userIds.map((user_id) => {
    const mine = own.filter((r) => r.user_id === user_id);
    const sections = Array.from({ length: sectionCount }, (_, i) => {
      const d = mergeDist(mine.filter((r) => r.section_index === i).map((r) => distribution(r.ratings)));
      return d.total ? d : null;
    });
    return { user_id, total: mergeDist(sections.filter((d): d is Dist => d !== null)), sections };
  });
};

export const percent = (share: number) => `${Math.round(share * 100)} %`;

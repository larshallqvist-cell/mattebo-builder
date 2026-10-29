import { describe, expect, test } from "bun:test";
import { isoWeek, summarizeActivity, summarizeTabelltest, surveyHistory } from "../src/lib/studentCard";

const tabell = (score: number, passed: boolean, created_at: string, input_mode = "voice", avg_time_ms = 1500) =>
  ({ score, total: 18, avg_time_ms, passed, input_mode, created_at });

describe("elevkort – tabelltestet", () => {
  test("best score, godkänt and newest attempt", () => {
    const summary = summarizeTabelltest([
      tabell(17, false, "2026-10-05T09:00:00Z"),
      tabell(18, true, "2026-10-12T09:00:00Z"),
      tabell(16, false, "2026-10-01T09:00:00Z", "keyboard", 2400),
    ]);
    expect(summary.attempts).toBe(3);
    expect(summary.bestScore).toBe(18);
    expect(summary.bestOf).toBe(18);
    expect(summary.passedAny).toBe(true);
    expect(summary.lastAt).toBe("2026-10-12T09:00:00Z");
    expect(summary.voice).toBe(2);
    expect(summary.keyboard).toBe(1);
  });

  test("a student who never passed shows it, and an empty history is safe", () => {
    expect(summarizeTabelltest([tabell(15, false, "2026-10-05T09:00:00Z")]).passedAny).toBe(false);
    expect(summarizeTabelltest([])).toMatchObject({ attempts: 0, bestScore: 0, passedAny: false, lastAt: null, avgTimeMs: null });
  });
});

describe("elevkort – veckoavstämning", () => {
  const surveys = [
    { id: "s1", grade: 7, week_start: "2026-10-05" },
    { id: "s2", grade: 7, week_start: "2026-10-12" },
  ];
  const response = (survey_id: string, created_at: string) =>
    ({ survey_id, q_learning: 4, q_effort: 3, q_calm: 5, q_teacher: 4, learned_text: "bråk", wish_text: "mer tid", created_at });

  test("answered weeks come newest first with an ISO week label", () => {
    const history = surveyHistory([response("s1", "2026-10-09T10:00:00Z"), response("s2", "2026-10-16T10:00:00Z")], surveys);
    expect(history).toHaveLength(2);
    expect(history[0].weekLabel).toBe("v42 · Åk 7");
    expect(history[0].answers).toEqual({ learning: 4, effort: 3, calm: 5, teacher: 4 });
    expect(history[1].weekLabel).toBe("v41 · Åk 7");
  });

  test("a response whose survey no longer exists is left out", () => {
    expect(surveyHistory([response("gone", "2026-10-16T10:00:00Z")], surveys)).toEqual([]);
  });

  test("iso week numbers", () => {
    expect(isoWeek("2026-01-01")).toBe(1);
    expect(isoWeek("2026-10-12")).toBe(42);
  });
});

describe("elevkort – aktivitet", () => {
  test("active time, visits and resource clicks are totalled", () => {
    const summary = summarizeActivity(
      [
        { visit_id: "v1", path: "/ak7", started_at: "2026-10-12T08:00:00Z", last_seen_at: "2026-10-12T08:20:00Z", active_seconds: 600 },
        { visit_id: "v1", path: "/ak7", started_at: "2026-10-12T08:20:00Z", last_seen_at: "2026-10-12T08:25:00Z", active_seconds: 300 },
        { visit_id: "v2", path: "/algebra", started_at: "2026-10-13T08:00:00Z", last_seen_at: "2026-10-13T08:10:00Z", active_seconds: 600 },
      ],
      [
        { grade: 7, chapter: 1, resource_title: "Kapitelbild", created_at: "2026-10-12T08:30:00Z" },
        { grade: 7, chapter: null, resource_title: "Spel", created_at: "2026-10-13T08:05:00Z" },
      ],
    );
    expect(summary.activeSeconds).toBe(1500);
    expect(summary.visits).toBe(2);
    expect(summary.resources).toBe(2);
    expect(summary.lastAt).toBe("2026-10-13T08:10:00Z");
  });

  test("no activity at all reads as zero, not as missing", () => {
    expect(summarizeActivity([], [])).toEqual({ activeSeconds: 0, visits: 0, resources: 0, lastAt: null });
  });
});

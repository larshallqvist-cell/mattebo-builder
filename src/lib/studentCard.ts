/** Pure aggregation for the admin "Elevkort": everything one student has done in Mattebo. */

export type TabelltestRow = {
  score: number;
  total: number;
  avg_time_ms: number;
  passed: boolean;
  input_mode: string;
  created_at: string;
};

export type SurveyRow = {
  survey_id: string;
  q_learning: number;
  q_effort: number;
  q_calm: number;
  q_teacher: number;
  learned_text: string;
  wish_text: string;
  created_at: string;
};

export type SurveyMeta = { id: string; grade: number; week_start: string };

export type VisitRow = {
  visit_id: string;
  path: string;
  started_at: string;
  last_seen_at: string;
  active_seconds: number;
};

export type ResourceRow = {
  grade: number;
  chapter: number | null;
  resource_title: string;
  created_at: string;
};

export type TabelltestSummary = {
  attempts: number;
  bestScore: number;
  bestOf: number;
  passedAny: boolean;
  lastAt: string | null;
  voice: number;
  keyboard: number;
  avgTimeMs: number | null;
};

/** `passed` is what the test itself stored, so it is never recalculated here. */
export function summarizeTabelltest(rows: TabelltestRow[]): TabelltestSummary {
  const best = rows.reduce<TabelltestRow | null>((b, r) => (!b || r.score > b.score ? r : b), null);
  const times = rows.map((r) => r.avg_time_ms).filter((t) => Number.isFinite(t) && t > 0);
  return {
    attempts: rows.length,
    bestScore: best?.score ?? 0,
    bestOf: best?.total ?? 0,
    passedAny: rows.some((r) => r.passed),
    lastAt: rows.reduce<string | null>((latest, r) => (!latest || Date.parse(r.created_at) > Date.parse(latest) ? r.created_at : latest), null),
    voice: rows.filter((r) => r.input_mode === "voice").length,
    keyboard: rows.filter((r) => r.input_mode === "keyboard").length,
    avgTimeMs: times.length ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length) : null,
  };
}

/** ISO-8601 week number, so a survey week reads the same as the school calendar. */
export function isoWeek(dateISO: string): number {
  const d = new Date(Date.UTC(Number(dateISO.slice(0, 4)), Number(dateISO.slice(5, 7)) - 1, Number(dateISO.slice(8, 10))));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export type SurveyEntry = {
  weekStart: string;
  weekLabel: string;
  answers: { learning: number; effort: number; calm: number; teacher: number };
  learned: string;
  wish: string;
  at: string;
};

/** One entry per answered week, newest week first. Responses whose survey is gone are dropped. */
export function surveyHistory(rows: SurveyRow[], surveys: SurveyMeta[]): SurveyEntry[] {
  const meta = new Map(surveys.map((s) => [s.id, s]));
  return rows
    .map<SurveyEntry | null>((r) => {
      const m = meta.get(r.survey_id);
      if (!m) return null;
      return {
        weekStart: m.week_start,
        weekLabel: `v${isoWeek(m.week_start)} · Åk ${m.grade}`,
        answers: { learning: r.q_learning, effort: r.q_effort, calm: r.q_calm, teacher: r.q_teacher },
        learned: r.learned_text,
        wish: r.wish_text,
        at: r.created_at,
      };
    })
    .filter((e): e is SurveyEntry => e !== null)
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));
}

export type ActivitySummary = { activeSeconds: number; visits: number; resources: number; lastAt: string | null };

export function summarizeActivity(visits: VisitRow[], logs: ResourceRow[]): ActivitySummary {
  const stamps = [...visits.map((v) => v.last_seen_at), ...logs.map((l) => l.created_at)];
  return {
    activeSeconds: visits.reduce((sum, v) => sum + v.active_seconds, 0),
    visits: new Set(visits.map((v) => v.visit_id)).size,
    resources: logs.length,
    lastAt: stamps.length ? stamps.reduce((a, b) => (Date.parse(b) > Date.parse(a) ? b : a)) : null,
  };
}

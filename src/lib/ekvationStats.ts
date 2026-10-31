// Statistik och progression för Ekvationspusslet – samma regler för elevens "Mina framsteg" och lärarens vyer.

export type EkvationRow = {
  session_id: string;
  level: number;
  is_correct: boolean;
  hint_used: boolean;
  created_at: string;
  puzzle_id?: string | null;
  error_kind?: string | null;
  seconds_spent?: number | null;
};

export type EkvationStatus = "none" | "mastered" | "practicing" | "struggling";

export type EkvationLevel = {
  attempts: number;      // alla rättade svar (fel + rätt)
  solved: number;        // lösta pussel
  firstTry: number;      // lösta på första försöket utan ledtråd
  wrong: number;
  hints: number;         // pussel där ledtråden öppnades
  priorityErrors: number; // fel där eleven räknade vänster → höger
  seconds: number;
  accuracy: number;      // % rätt av alla svar
  recentFirstTryRate: number; // andel första-försöket bland de senaste 10 lösta
  stars: 0 | 1 | 2 | 3;
  mastery: number;       // 0–100
  status: EkvationStatus;
};

export type EkvationSummary = {
  levels: EkvationLevel[];
  solved: number;
  attempts: number;
  seconds: number;
  hints: number;
  priorityErrors: number;
  /** Fel på nivå 3–4 där prioriteringsfel var möjligt. */
  priorityChances: number;
  bestStreak: number;
  currentStreak: number;
  lastAt: string | null;
};

export const LEVEL_COUNT = 4;
/** Antal lösta pussel som krävs för att en nivå ska kunna räknas som bemästrad. */
export const MASTERY_SOLVED = 8;
/** Andel av de senaste lösta som måste vara rätt på första försöket utan ledtråd. */
export const MASTERY_RATE = 0.8;
const RECENT = 10;

type Puzzle = { level: number; at: string; wrong: number; priority: number; hint: boolean; solved: boolean; seconds: number };

/**
 * Grupperar svar till pussel. Nya rader har puzzle_id. Äldre rader saknar det: då hör felsvar till
 * nästa rätta svar på samma nivå i samma pass (det är så sidan fungerar – samma pussel tills det är löst).
 */
export function groupPuzzles(rows: EkvationRow[]): Puzzle[] {
  const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const byId = new Map<string, Puzzle>();
  const open = new Map<string, Puzzle>(); // session+nivå → pågående äldre pussel
  const out: Puzzle[] = [];
  for (const r of sorted) {
    let p: Puzzle | undefined;
    if (r.puzzle_id) {
      p = byId.get(r.puzzle_id);
      if (!p) { p = blank(r); byId.set(r.puzzle_id, p); out.push(p); }
    } else {
      const key = `${r.session_id}:${r.level}`;
      p = open.get(key);
      if (!p) { p = blank(r); open.set(key, p); out.push(p); }
      if (r.is_correct) open.delete(key);
    }
    p.at = r.created_at;
    p.seconds += Math.max(0, Math.min(300, r.seconds_spent ?? 0));
    if (r.hint_used) p.hint = true;
    if (r.is_correct) p.solved = true;
    else { p.wrong++; if (r.error_kind === "priority") p.priority++; }
  }
  return out;
}
const blank = (r: EkvationRow): Puzzle => ({ level: r.level, at: r.created_at, wrong: 0, priority: 0, hint: false, solved: false, seconds: 0 });

const isClean = (p: Puzzle) => p.solved && p.wrong === 0 && !p.hint;

export function levelStatus(l: Pick<EkvationLevel, "attempts" | "solved" | "recentFirstTryRate" | "accuracy">): EkvationStatus {
  if (l.attempts === 0) return "none";
  if (l.solved >= MASTERY_SOLVED && l.recentFirstTryRate >= MASTERY_RATE) return "mastered";
  if (l.attempts >= 5 && l.accuracy < 50) return "struggling";
  return "practicing";
}

export function summarize(rows: EkvationRow[]): EkvationSummary {
  const puzzles = groupPuzzles(rows);
  const levels: EkvationLevel[] = Array.from({ length: LEVEL_COUNT }, (_, i) => {
    const list = puzzles.filter((p) => p.level === i);
    const solvedList = list.filter((p) => p.solved);
    const levelRows = rows.filter((r) => r.level === i);
    const attempts = levelRows.length;
    const right = levelRows.filter((r) => r.is_correct).length;
    const recent = solvedList.slice(-RECENT);
    const recentFirstTryRate = recent.length ? recent.filter(isClean).length / recent.length : 0;
    const accuracy = attempts ? Math.round((right / attempts) * 100) : 0;
    const solved = solvedList.length;
    const progress = Math.min(solved, MASTERY_SOLVED) / MASTERY_SOLVED;
    const quality = Math.min(1, recentFirstTryRate / MASTERY_RATE);
    const base = { attempts, solved, recentFirstTryRate, accuracy };
    const status = levelStatus(base);
    const stars: EkvationLevel["stars"] = status === "mastered" ? 3 : solved >= 5 && recentFirstTryRate >= 0.6 ? 2 : solved >= 3 ? 1 : 0;
    return {
      ...base,
      firstTry: solvedList.filter(isClean).length,
      wrong: attempts - right,
      hints: list.filter((p) => p.hint).length,
      priorityErrors: list.reduce((s, p) => s + p.priority, 0),
      seconds: list.reduce((s, p) => s + p.seconds, 0),
      stars,
      mastery: status === "mastered" ? 100 : Math.round(progress * quality * 100),
      status,
    };
  });

  // Svit = lösta pussel i följd utan fel och utan ledtråd. Ett överhoppat pussel bryter inte sviten.
  let run = 0, bestStreak = 0;
  for (const p of puzzles) {
    if (!p.solved && p.wrong === 0) continue;
    run = isClean(p) ? run + 1 : 0;
    bestStreak = Math.max(bestStreak, run);
  }

  return {
    levels,
    solved: levels.reduce((s, l) => s + l.solved, 0),
    attempts: rows.length,
    seconds: levels.reduce((s, l) => s + l.seconds, 0),
    hints: levels.reduce((s, l) => s + l.hints, 0),
    priorityErrors: levels.reduce((s, l) => s + l.priorityErrors, 0),
    priorityChances: levels[2].wrong + levels[3].wrong,
    bestStreak,
    currentStreak: run,
    lastAt: puzzles.length ? puzzles[puzzles.length - 1].at : null,
  };
}

/** Nästa nivå att rekommendera efter en bemästrad nivå, annars null. */
export function recommendedNext(s: EkvationSummary, level: number): number | null {
  if (s.levels[level]?.status !== "mastered") return null;
  for (let i = level + 1; i < LEVEL_COUNT; i++) if (s.levels[i].status !== "mastered") return i;
  return null;
}

/** Sant när just det här svaret gjorde nivån bemästrad. */
export function justMastered(before: EkvationSummary, after: EkvationSummary, level: number) {
  return before.levels[level]?.status !== "mastered" && after.levels[level]?.status === "mastered";
}

export type Assessment = { area: string; levels: string; verdict: "Behärskar" | "På väg" | "Behöver stöd" | "Ej visat"; note: string };

/** Formativt bedömningsunderlag i tre förmågor. */
export function assessment(s: EkvationSummary): Assessment[] {
  const [l1, l2, l3, l4] = s.levels;
  const verdict = (ls: EkvationLevel[]): Assessment["verdict"] => {
    if (ls.every((l) => l.status === "none")) return "Ej visat";
    if (ls.every((l) => l.status === "mastered")) return "Behärskar";
    if (ls.some((l) => l.status === "struggling")) return "Behöver stöd";
    return "På väg";
  };
  const prio = l3.priorityErrors + l4.priorityErrors;
  let prioVerdict = verdict([l3]);
  if (prioVerdict === "Behärskar" && l3.wrong > 0 && prio / l3.wrong > 0.5 && l3.recentFirstTryRate < 0.9) prioVerdict = "På väg";
  return [
    {
      area: "Enkla samband automatiserade", levels: "Nivå 1–2", verdict: verdict([l1, l2]),
      note: `${l1.solved + l2.solved} lösta, ${pctOf(l1.firstTry + l2.firstTry, l1.solved + l2.solved)} % direkt rätt utan ledtråd.`,
    },
    {
      area: "Prioriteringsregler i ekvationsform", levels: "Nivå 3", verdict: prioVerdict,
      note: `${l3.solved} lösta · ${l3.priorityErrors} prioriteringsfel (räknade vänster → höger)${l3.wrong ? ` av ${l3.wrong} fel` : ""}.`,
    },
    {
      area: "Formell variabelhantering x, y, z", levels: "Nivå 4", verdict: verdict([l4]),
      note: `${l4.solved} lösta, ${pctOf(l4.firstTry, l4.solved)} % direkt rätt · ${l4.priorityErrors} prioriteringsfel.`,
    },
  ];
}

export const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const m = Math.round(seconds / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

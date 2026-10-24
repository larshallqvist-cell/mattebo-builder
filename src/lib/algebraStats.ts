export type Attempt = { user_id: string; session_id: string; mode: string; level: number; is_correct: boolean; created_at: string };
export type LevelStatus = "none" | "mastered" | "practicing" | "struggling";
export type LevelStat = { right: number; total: number; status: LevelStatus };
export type StudentStats = {
  userId: string; lastAt: string; total: number; right: number; highestMastered: number | null;
  last: { right: number; total: number; levels: number[]; at: string };
  levels: LevelStat[];
};

export const LEVEL_COUNT = 7;
/** Bemästrad: minst 5 svar och minst 80 % rätt. Övar: 50–79 %. Svårt: under 50 %. */
export function levelStatus(right: number, total: number): LevelStatus {
  if (total === 0) return "none";
  const p = right / total;
  if (p >= 0.8 && total >= 5) return "mastered";
  if (p >= 0.5) return "practicing";
  return "struggling";
}

export const pct = (right: number, total: number) => (total ? Math.round((right / total) * 100) : 0);

/** Attempts may arrive in any order; newest session = last pass. Optional mode filter. */
export function buildStats(rows: Attempt[], mode?: string): StudentStats[] {
  const byUser = new Map<string, Attempt[]>();
  for (const r of rows) if (!mode || r.mode === mode) (byUser.get(r.user_id) ?? byUser.set(r.user_id, []).get(r.user_id)!).push(r);
  const out: StudentStats[] = [];
  for (const [userId, list] of byUser) {
    list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    const lastSession = list[0].session_id;
    const lastRows = list.filter((r) => r.session_id === lastSession);
    const levels: LevelStat[] = Array.from({ length: LEVEL_COUNT }, () => ({ right: 0, total: 0, status: "none" as LevelStatus }));
    for (const r of list) { const l = levels[r.level]; if (!l) continue; l.total++; if (r.is_correct) l.right++; }
    levels.forEach((l) => (l.status = levelStatus(l.right, l.total)));
    let highestMastered: number | null = null;
    levels.forEach((l, i) => { if (l.status === "mastered") highestMastered = i; });
    out.push({
      userId, lastAt: list[0].created_at, total: list.length, right: list.filter((r) => r.is_correct).length, highestMastered,
      last: { right: lastRows.filter((r) => r.is_correct).length, total: lastRows.length, levels: [...new Set(lastRows.map((r) => r.level))].sort(), at: list[0].created_at },
      levels,
    });
  }
  return out.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

/** Which game buttons each class sees per chapter. Teacher overrides live in
 *  public.game_visibility; anything without a saved row falls back to the defaults here. */
export const GAME_KEYS = [
  "drills", "tabellerna", "mathdrop", "brak", "tabelltest",
  "algebra", "procent", "ekvationer", "koordinater", "kistan",
] as const;
export type GameKey = (typeof GAME_KEYS)[number];

export const GAME_LABELS: Record<GameKey, string> = {
  drills: "Drills",
  tabellerna: "Tabellerna",
  mathdrop: "Mathdrop",
  brak: "Bråklabbet",
  tabelltest: "Tabelltest",
  algebra: "Algebra",
  procent: "Procent",
  ekvationer: "Ekvationer",
  koordinater: "Koordinater",
  kistan: "Kistan",
};

export const VISIBILITY_GRADES = [6, 7, 8, 9] as const;
export const VISIBILITY_CHAPTERS = [1, 2, 3, 4, 5] as const;

export interface VisibilityRow {
  grade: number;
  chapter: number;
  game_key: string;
  enabled: boolean;
}

/** Defaults before the teacher changes anything: every game on, except Kistan only in Åk 6–7. */
export function defaultEnabled(game: GameKey, grade: number): boolean {
  if (game === "kistan") return grade === 6 || grade === 7;
  return true;
}

export function isGameEnabled(rows: readonly VisibilityRow[], game: GameKey, grade: number, chapter: number): boolean {
  const row = rows.find((r) => r.grade === grade && r.chapter === chapter && r.game_key === game);
  return row ? row.enabled : defaultEnabled(game, grade);
}

/** A game page is open to a class when the game is switched on in at least one of its chapters. */
export function isGameOpenForGrade(rows: readonly VisibilityRow[], game: GameKey, grade: number): boolean {
  return VISIBILITY_CHAPTERS.some((c) => isGameEnabled(rows, game, grade, c));
}

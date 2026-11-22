import { CHAPTER_SUBTITLES } from "@/config/app";

/** Which game buttons each class sees per chapter. Teacher overrides live in
 *  public.game_visibility; anything without a saved row falls back to the defaults here. */
export const GAME_KEYS = [
  "drills", "tabellerna", "mathdrop", "brak", "tabelltest",
  "algebra", "procent", "ekvationer", "koordinater", "kistan", "linjen", "sannolikhet", "geometrigymmet",
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
  linjen: "Räta linjen",
  sannolikhet: "Sannolikhet",
  geometrigymmet: "Geometrigymmet",
};

export const VISIBILITY_GRADES = [6, 7, 8, 9] as const;
export const VISIBILITY_CHAPTERS = [1, 2, 3, 4, 5] as const;

export interface VisibilityRow {
  grade: number;
  chapter: number;
  game_key: string;
  enabled: boolean;
}

/** Defaults before the teacher changes anything: every game on, except Kistan only in Åk 6–7, Räta linjen only in Åk 9 and Geometrigymmet only in Åk 7. */
export function defaultEnabled(game: GameKey, grade: number): boolean {
  if (game === "kistan") return grade === 6 || grade === 7;
  if (game === "linjen") return grade === 9;
  if (game === "geometrigymmet") return grade === 7;
  return true;
}

export function isGameEnabled(rows: readonly VisibilityRow[], game: GameKey, grade: number, chapter: number): boolean {
  const row = rows.find((r) => r.grade === grade && r.chapter === chapter && r.game_key === game);
  return row ? row.enabled : defaultEnabled(game, grade);
}

/** Words that say nothing about the chapter's topic, skipped when picking a header word. */
const CHAPTER_FILLER_WORDS = new Set(["och", "med", "av", "i", "på", "till", "sikte", "tals"]);

/** One short word from the chapter name, used as the column header in the admin game matrix
 *  (e.g. "Bråk och procent" → "Bråk", "Med sikte på framtiden" → "Framtiden"). Falls back to "Kap N". */
export function chapterKeyword(grade: number, chapter: number): string {
  const name = CHAPTER_SUBTITLES[grade as keyof typeof CHAPTER_SUBTITLES]?.[chapter];
  if (!name) return `Kap ${chapter}`;
  const word = name
    .split(/\s+/)
    .map((w) => w.replace(/[,.]/g, ""))
    .find((w) => w.length > 0 && !CHAPTER_FILLER_WORDS.has(w.toLowerCase()));
  if (!word) return `Kap ${chapter}`;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Full chapter name for tooltips, empty when unknown. */
export function chapterName(grade: number, chapter: number): string {
  return CHAPTER_SUBTITLES[grade as keyof typeof CHAPTER_SUBTITLES]?.[chapter] ?? "";
}

/** A game page is open to a class when the game is switched on in at least one of its chapters. */
export function isGameOpenForGrade(rows: readonly VisibilityRow[], game: GameKey, grade: number): boolean {
  return VISIBILITY_CHAPTERS.some((c) => isGameEnabled(rows, game, grade, c));
}

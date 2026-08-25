// Central app configuration — single source of truth for grades, colors,
// chapter metadata and default external resource IDs used across the frontend.

export const SUPPORTED_GRADES = [6, 7, 8, 9] as const;
export type Grade = (typeof SUPPORTED_GRADES)[number];

export const GRADE_LABELS: Record<Grade, string> = {
  6: "Åk 6",
  7: "Åk 7",
  8: "Åk 8",
  9: "Åk 9",
};

export const GRADE_NEON_COLORS: Record<Grade, string> = {
  6: "hsl(var(--neon-turquoise))",
  7: "hsl(var(--neon-copper))",
  8: "hsl(var(--neon-blue))",
  9: "hsl(var(--neon-violet))",
};

export const GRADE_CARD_COLORS: Record<
  Grade,
  { neon: string; glow: string; border: string }
> = {
  6: {
    neon: "hsl(var(--grade-6))",
    glow: "0 18px 30px -12px hsl(var(--grade-6) / 0.55), 0 30px 60px -20px hsl(211 69% 8% / 0.8), inset 0 1px 0 hsl(0 0% 100% / 0.25)",
    border: "hsl(var(--grade-6) / 0.6)",
  },
  7: {
    neon: "hsl(var(--grade-7))",
    glow: "0 18px 30px -12px hsl(var(--grade-7) / 0.55), 0 30px 60px -20px hsl(211 69% 8% / 0.8), inset 0 1px 0 hsl(0 0% 100% / 0.25)",
    border: "hsl(var(--grade-7) / 0.6)",
  },
  8: {
    neon: "hsl(var(--grade-8))",
    glow: "0 18px 30px -12px hsl(var(--grade-8) / 0.55), 0 30px 60px -20px hsl(211 69% 8% / 0.8), inset 0 1px 0 hsl(0 0% 100% / 0.25)",
    border: "hsl(var(--grade-8) / 0.6)",
  },
  9: {
    neon: "hsl(var(--grade-9))",
    glow: "0 18px 30px -12px hsl(var(--grade-9) / 0.55), 0 30px 60px -20px hsl(211 69% 8% / 0.8), inset 0 1px 0 hsl(0 0% 100% / 0.25)",
    border: "hsl(var(--grade-9) / 0.6)",
  },
};


export const DEFAULT_SHEET_ID = "1UzIhln8WHH_Toy7-cXXmlMi4UQEg6DEypzE_kVNkFkQ";
export const SHEET_STORAGE_KEY = "mattebo_sheet_id";

export const CHAPTER_SUBTITLES: Record<Grade, Record<number, string>> = {
  6: {
    1: "Taluppfattning och huvudräkning",
    2: "Bråk och procent",
    3: "Samband, uttryck och ekvationer",
    4: "Geometri",
    5: "Med sikte på framtiden",
  },
  7: {
    1: "Taluppfattning och tals användning",
    2: "Algebra",
    3: "Geometri",
    4: "Samband och förändring",
    5: "Sannolikhet och statistik",
  },
  8: {
    1: "Taluppfattning och tals användning",
    2: "Samband och förändring",
    3: "Geometri",
    4: "Algebra",
    5: "Sannolikhet och statistik",
  },
  9: {
    1: "Taluppfattning och tals användning",
    2: "Samband och förändring",
    3: "Algebra",
    4: "Geometri",
    5: "Med sikte på framtiden",
  },
};

export const CHAPTER_COOKIE_PREFIX = "mattebo_chapter_grade_";
export const CHAPTER_COOKIE_DAYS = 42;
export const MIN_CHAPTER = 1;
export const MAX_CHAPTER = 5;
export const DEFAULT_GRADE = 9;

